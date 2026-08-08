const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/v1/addresses
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await all('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
    return res.json(addresses);
  } catch (err) {
    console.error('Error fetching addresses:', err);
    return res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/v1/addresses
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, line1, line2 = '', city, state, pincode, is_default = 0 } = req.body;

    if (!name || !phone || !line1 || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Name, phone, line1, city, state, and pincode are required' });
    }

    const addrId = `addr-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    if (is_default) {
      await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    await run(`
      INSERT INTO addresses (id, user_id, name, phone, line1, line2, city, state, pincode, is_default, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [addrId, userId, name, phone, line1, line2, city, state, pincode, is_default ? 1 : 0, now]);

    const created = await get('SELECT * FROM addresses WHERE id = ?', [addrId]);
    return res.status(201).json(created);
  } catch (err) {
    console.error('Error creating address:', err);
    return res.status(500).json({ error: 'Failed to create address' });
  }
});

// PUT /api/v1/addresses/:id/default
router.put('/:id/default', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    await run('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, userId]);

    return res.json({ success: true, message: 'Default address updated' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to set default address' });
  }
});

// DELETE /api/v1/addresses/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await run('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    return res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete address' });
  }
});

module.exports = router;
