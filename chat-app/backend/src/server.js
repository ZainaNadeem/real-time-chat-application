const express = require('express')
const cors = require('cors')
const http = require('http')
require('dotenv').config()

const pool = require('./db')
const authRoutes = require('./routes/auth')
const setupWebSocket = require('./websocket')

const app = express()
const PORT = process.env.PORT || 5001
const roomRoutes = require('./routes/rooms')
// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Chat server is running!' })
})

app.get('/db-test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result')
    res.json({ message: 'Database connected!', result: rows[0].result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.use('/auth', authRoutes)
app.use('/rooms', roomRoutes)
// Create HTTP server (needed to share it with WebSockets)
const server = http.createServer(app)

// Attach WebSocket server
setupWebSocket(server)

// Start
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})