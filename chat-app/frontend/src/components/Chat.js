import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = 'http://localhost:5001'
const WS_URL = 'ws://localhost:5001'

function Chat({ user, onLogout }) {
  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [typingUsers, setTypingUsers] = useState([])
  const [connected, setConnected] = useState(false)

  const ws = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeout = useRef(null)

  // Fetch rooms on load
  useEffect(() => {
    axios.get(`${API}/rooms`, {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(res => setRooms(res.data))
  }, [user.token])

  // Connect WebSocket
  useEffect(() => {
    ws.current = new WebSocket(WS_URL)

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'auth', token: user.token }))
    }

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === 'auth_success') setConnected(true)
      if (msg.type === 'message_history') setMessages(msg.messages)
      if (msg.type === 'new_message') setMessages(prev => [...prev, msg])
      if (msg.type === 'user_typing') {
        setTypingUsers(prev =>
          msg.isTyping
            ? [...new Set([...prev, msg.username])]
            : prev.filter(u => u !== msg.username)
        )
      }
    }

    ws.current.onclose = () => setConnected(false)

    return () => ws.current?.close()
  }, [user.token])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const joinRoom = (room) => {
    setCurrentRoom(room)
    setMessages([])
    setTypingUsers([])
    ws.current.send(JSON.stringify({ type: 'join_room', roomId: room.id }))
  }

  const sendMessage = () => {
    if (!input.trim() || !currentRoom) return
    ws.current.send(JSON.stringify({ type: 'send_message', content: input }))
    setInput('')
    // Stop typing indicator
    ws.current.send(JSON.stringify({ type: 'typing', isTyping: false }))
  }

  const handleTyping = (e) => {
    setInput(e.target.value)
    ws.current.send(JSON.stringify({ type: 'typing', isTyping: true }))
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      ws.current.send(JSON.stringify({ type: 'typing', isTyping: false }))
    }, 1500)
  }

  const createRoom = async () => {
    if (!newRoomName.trim()) return
    try {
      const res = await axios.post(`${API}/rooms`,
        { name: newRoomName },
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      setRooms(prev => [res.data, ...prev])
      setNewRoomName('')
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create room')
    }
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.appName}>💬 ChatApp</span>
          <button style={styles.logoutBtn} onClick={onLogout}>Exit</button>
        </div>

        <div style={styles.userInfo}>
          <span style={styles.onlineDot}>●</span> {user.username}
          {connected ? <span style={styles.connectedBadge}>connected</span> : null}
        </div>

        <div style={styles.createRoom}>
          <input
            style={styles.roomInput}
            placeholder="New room name..."
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createRoom()}
          />
          <button style={styles.createBtn} onClick={createRoom}>+</button>
        </div>

        <div style={styles.roomList}>
          <p style={styles.roomsLabel}>ROOMS</p>
          {rooms.map(room => (
            <div
              key={room.id}
              style={{ ...styles.roomItem, ...(currentRoom?.id === room.id ? styles.activeRoom : {}) }}
              onClick={() => joinRoom(room)}
            >
              # {room.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div style={styles.main}>
        {currentRoom ? (
          <>
            <div style={styles.chatHeader}>
              <span style={styles.roomName}># {currentRoom.name}</span>
            </div>

            <div style={styles.messages}>
              {messages.length === 0 && (
                <p style={styles.emptyMsg}>No messages yet. Say hello! 👋</p>
              )}
              {messages.map((msg, i) => (
                <div key={msg.id || i} style={styles.message}>
                  <span style={styles.msgUsername}>{msg.username}</span>
                  <span style={styles.msgTime}>{formatTime(msg.created_at)}</span>
                  <p style={styles.msgContent}>{msg.content}</p>
                </div>
              ))}
              {typingUsers.length > 0 && (
                <p style={styles.typing}>{typingUsers.join(', ')} is typing...</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputArea}>
              <input
                style={styles.messageInput}
                placeholder={`Message #${currentRoom.name}`}
                value={input}
                onChange={handleTyping}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button style={styles.sendBtn} onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div style={styles.noRoom}>
            <p>👈 Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', height: '100vh' },
  sidebar: { width: '260px', background: '#16213e', display: 'flex', flexDirection: 'column', borderRight: '1px solid #0f3460' },
  sidebarHeader: { padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0f3460' },
  appName: { fontWeight: 'bold', fontSize: '1.1rem' },
  logoutBtn: { background: 'none', border: '1px solid #555', color: '#aaa', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  userInfo: { padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' },
  onlineDot: { color: '#4caf50', fontSize: '0.7rem' },
  connectedBadge: { fontSize: '0.7rem', background: '#1a3a1a', color: '#4caf50', padding: '2px 6px', borderRadius: '4px' },
  createRoom: { padding: '0.75rem 1rem', display: 'flex', gap: '8px' },
  roomInput: { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: '0.85rem', outline: 'none' },
  createBtn: { padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' },
  roomList: { flex: 1, overflowY: 'auto', padding: '0 0.5rem' },
  roomsLabel: { padding: '0.5rem', fontSize: '0.7rem', color: '#666', letterSpacing: '1px' },
  roomItem: { padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', color: '#aaa', fontSize: '0.9rem', marginBottom: '2px' },
  activeRoom: { background: '#0f3460', color: '#fff' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  chatHeader: { padding: '1rem 1.5rem', borderBottom: '1px solid #0f3460', background: '#16213e' },
  roomName: { fontWeight: 'bold', fontSize: '1rem' },
  messages: { flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '4px' },
  emptyMsg: { color: '#555', textAlign: 'center', marginTop: '2rem' },
  message: { padding: '6px 0' },
  msgUsername: { fontWeight: 'bold', color: '#e94560', marginRight: '8px', fontSize: '0.9rem' },
  msgTime: { color: '#555', fontSize: '0.75rem' },
  msgContent: { color: '#ddd', marginTop: '2px', lineHeight: '1.4' },
  typing: { color: '#888', fontSize: '0.85rem', fontStyle: 'italic' },
  inputArea: { padding: '1rem 1.5rem', borderTop: '1px solid #0f3460', display: 'flex', gap: '8px' },
  messageInput: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: '1rem', outline: 'none' },
  sendBtn: { padding: '12px 20px', borderRadius: '8px', border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  noRoom: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '1.1rem' }
}

export default Chat