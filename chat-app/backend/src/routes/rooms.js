const express = require('express')
const pool = require('../db')
const jwt = require('jsonwebtoken')

const router = express.Router()

// Middleware to verify JWT token
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// GET all rooms
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rooms] = await pool.query(
      `SELECT r.id, r.name, r.created_at, u.username AS created_by
       FROM rooms r
       JOIN users u ON r.created_by = u.id
       ORDER BY r.created_at DESC`
    )
    res.json(rooms)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create a room
router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Room name is required' })

  try {
    const [result] = await pool.query(
      'INSERT INTO rooms (name, created_by) VALUES (?, ?)',
      [name, req.user.id]
    )
    res.status(201).json({ id: result.insertId, name, created_by: req.user.username })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Room name already exists' })
    }
    res.status(500).json({ error: err.message })
  }
})

module.exports = router