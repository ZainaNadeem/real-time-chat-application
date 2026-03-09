const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')

const router = express.Router()

// REGISTER
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    )
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already taken' })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Save user to database
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    )

    // Create JWT token
    const token = jwt.sign(
      { id: result.insertId, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, username, id: result.insertId })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    // Find user by email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    const user = users[0]

    // Compare password with hash
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, username: user.username, id: user.id })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
