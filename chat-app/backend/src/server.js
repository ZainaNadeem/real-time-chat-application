const express = require('express')
const cors = require('cors')
require('dotenv').config()

const pool = require('./db')
const authRoutes = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/auth', authRoutes)

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Chat server is running!' })
})

// Test database connection
app.get('/db-test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result')
    res.json({ message: 'Database connected!', result: rows[0].result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
