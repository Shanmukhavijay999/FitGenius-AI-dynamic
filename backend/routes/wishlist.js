const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db');
const { verifyToken } = require('../middleware/auth');
const { formatProduct } = require('./products');

// GET /api/v1/wishlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sql = `
      SELECT p.*, w.created_at as wishlisted_at
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `;
    const rows = await all(sql, [userId]);
    const items = rows.map(r => ({
      ...formatProduct(r),
      wishlistedAt: r.wishlisted_at
    }));
    return res.json({ count: items.length, products: items });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    return res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// GET /api/v1/wishlist/count
router.get('/count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const row = await get('SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?', [userId]);
    return res.json({ count: row ? row.count : 0 });
  } catch (err) {
    return res.json({ count: 0 });
  }
});

// GET /api/v1/wishlist/check/:productId
router.get('/check/:productId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const row = await get('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    return res.json({ isWishlisted: !!row });
  } catch (err) {
    return res.json({ isWishlisted: false });
  }
});

// POST /api/v1/wishlist
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const product = await get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existing = await get('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    if (existing) {
      return res.json({ success: true, message: 'Already in wishlist', isWishlisted: true });
    }

    const id = `wish-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    await run('INSERT INTO wishlist (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)', [
      id, userId, productId, now
    ]);

    await run('UPDATE products SET favorites = favorites + 1 WHERE id = ?', [productId]);

    return res.status(201).json({ success: true, message: 'Added to wishlist', isWishlisted: true });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    return res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/v1/wishlist/:productId
router.delete('/:productId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await run('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    await run('UPDATE products SET favorites = MAX(0, favorites - 1) WHERE id = ?', [productId]);

    return res.json({ success: true, message: 'Removed from wishlist', isWishlisted: false });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    return res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
