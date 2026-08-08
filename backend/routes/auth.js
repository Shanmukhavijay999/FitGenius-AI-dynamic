const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../db');
const { generateToken, verifyToken } = require('../middleware/auth');

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'customer', phone = '' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userId = role === 'seller' ? `usr-seller-${uuidv4().slice(0, 6)}` : `usr-cust-${uuidv4().slice(0, 6)}`;
    const hash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    await run(`
      INSERT INTO users (id, name, email, password_hash, profile_image, phone, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, name.trim(), email.toLowerCase().trim(), hash, avatar, phone, role, now]);

    const token = generateToken({ id: userId, email: email.toLowerCase().trim(), role, name: name.trim() });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        profileImage: avatar,
        phone,
        role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.password_hash) {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profile_image,
        phone: user.phone || '',
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, profile_image, phone, role FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      // Fallback seller or customer
      return res.json({
        id: 'usr-customer-001',
        name: 'Alex Johnson',
        email: 'alex@fitgenius.ai',
        profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        phone: '+91 98765 43210',
        role: 'customer'
      });
    }
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profile_image,
      phone: user.phone || '',
      role: user.role
    });
  } catch (err) {
    console.error('Error fetching auth user:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
