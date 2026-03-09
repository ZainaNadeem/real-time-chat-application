const { WebSocketServer } = require('ws')
const jwt = require('jsonwebtoken')
const pool = require('./db')

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server })

  // rooms is a Map: roomId -> Set of connected clients
  const rooms = new Map()

  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection')

    // Each client gets some state
    ws.userId = null
    ws.username = null
    ws.roomId = null

    ws.on('message', async (data) => {
      let msg

      // Parse the incoming message
      try {
        msg = JSON.parse(data)
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
        return
      }

      // Handle different message types
      switch (msg.type) {

        // ── AUTH ──────────────────────────────────────────────
        case 'auth': {
          try {
            const payload = jwt.verify(msg.token, process.env.JWT_SECRET)
            ws.userId = payload.id
            ws.username = payload.username
            ws.send(JSON.stringify({ type: 'auth_success', username: ws.username }))
            console.log(`${ws.username} authenticated`)
          } catch {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }))
            ws.close()
          }
          break
        }

        // ── JOIN ROOM ─────────────────────────────────────────
        case 'join_room': {
          if (!ws.userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
            return
          }

          const roomId = msg.roomId

          // Leave previous room if any
          if (ws.roomId && rooms.has(ws.roomId)) {
            rooms.get(ws.roomId).delete(ws)
          }

          // Add to new room
          if (!rooms.has(roomId)) rooms.set(roomId, new Set())
          rooms.get(roomId).add(ws)
          ws.roomId = roomId

          // Fetch last 50 messages from DB
          const [messages] = await pool.query(
            `SELECT m.id, m.content, m.created_at, u.username
             FROM messages m
             JOIN users u ON m.user_id = u.id
             WHERE m.room_id = ?
             ORDER BY m.created_at DESC
             LIMIT 50`,
            [roomId]
          )

          ws.send(JSON.stringify({
            type: 'message_history',
            messages: messages.reverse()
          }))

          // Notify room that user joined
          broadcast(rooms, roomId, {
            type: 'user_joined',
            username: ws.username
          }, ws)

          console.log(`${ws.username} joined room ${roomId}`)
          break
        }

        // ── SEND MESSAGE ──────────────────────────────────────
        case 'send_message': {
          if (!ws.userId || !ws.roomId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not in a room' }))
            return
          }

          const content = msg.content?.trim()
          if (!content) return

          // Save to database
          const [result] = await pool.query(
            'INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)',
            [ws.roomId, ws.userId, content]
          )

          // Broadcast to everyone in the room (including sender)
          broadcast(rooms, ws.roomId, {
            type: 'new_message',
            id: result.insertId,
            content,
            username: ws.username,
            created_at: new Date().toISOString()
          })

          break
        }

        // ── TYPING INDICATOR ──────────────────────────────────
        case 'typing': {
          if (!ws.userId || !ws.roomId) return
          broadcast(rooms, ws.roomId, {
            type: 'user_typing',
            username: ws.username,
            isTyping: msg.isTyping
          }, ws) // exclude sender
          break
        }

        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }))
      }
    })

    // Handle disconnect
    ws.on('close', () => {
      if (ws.roomId && rooms.has(ws.roomId)) {
        rooms.get(ws.roomId).delete(ws)
        broadcast(rooms, ws.roomId, {
          type: 'user_left',
          username: ws.username
        })
      }
      console.log(`${ws.username || 'Unknown'} disconnected`)
    })
  })

  return wss
}

// Send a message to all clients in a room, optionally excluding one
function broadcast(rooms, roomId, message, exclude = null) {
  if (!rooms.has(roomId)) return
  const json = JSON.stringify(message)
  rooms.get(roomId).forEach((client) => {
    if (client !== exclude && client.readyState === 1) {
      client.send(json)
    }
  })
}

module.exports = setupWebSocket