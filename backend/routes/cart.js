const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db');
const { verifyToken } = require('../middleware/auth');
const { formatProduct } = require('./products');

// Helper to ensure cart exists for user
async function getOrCreateCart(userId) {
  let cart = await get('SELECT * FROM cart WHERE user_id = ?', [userId]);
  if (!cart) {
    const cartId = `cart-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    await run('INSERT INTO cart (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)', [
      cartId, userId, now, now
    ]);
    cart = { id: cartId, user_id: userId, created_at: now, updated_at: now };
  }
  return cart;
}

// GET /api/v1/cart
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);

    const itemsRows = await all(`
      SELECT ci.id as item_id, ci.size, ci.quantity, ci.created_at as item_added_at, p.*
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `, [cart.id]);

    const items = itemsRows.map(r => {
      const formattedProd = formatProduct(r);
      const unitPrice = formattedProd.discountPrice || formattedProd.price;
      const subtotal = unitPrice * r.quantity;

      return {
        id: r.item_id,
        productId: r.id,
        size: r.size,
        quantity: r.quantity,
        price: unitPrice,
        mrp: formattedProd.price,
        subtotal,
        product: formattedProd
      };
    });

    const totalMrp = items.reduce((acc, i) => acc + (i.mrp * i.quantity), 0);
    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
    const discount = Math.max(0, totalMrp - subtotal);
    const deliveryCharge = subtotal > 1999 || items.length === 0 ? 0 : 99;
    const totalAmount = subtotal + deliveryCharge;

    return res.json({
      cartId: cart.id,
      itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
      totalMrp,
      subtotal,
      discount,
      deliveryCharge,
      totalAmount,
      items
    });
  } catch (err) {
    console.error('Error fetching cart:', err);
    return res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// GET /api/v1/cart/count
router.get('/count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await get('SELECT id FROM cart WHERE user_id = ?', [userId]);
    if (!cart) return res.json({ count: 0 });

    const row = await get('SELECT SUM(quantity) as count FROM cart_items WHERE cart_id = ?', [cart.id]);
    return res.json({ count: row && row.count ? row.count : 0 });
  } catch (err) {
    return res.json({ count: 0 });
  }
});

// POST /api/v1/cart/items
router.post('/items', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, size = 'M', quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const product = await get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const cart = await getOrCreateCart(userId);
    const numQty = parseInt(quantity, 10) || 1;

    // Check if item with same size already exists in cart
    const existing = await get(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND size = ?',
      [cart.id, productId, size]
    );

    if (existing) {
      const newQty = existing.quantity + numQty;
      await run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      const itemId = `ci-${uuidv4().slice(0, 8)}`;
      const now = new Date().toISOString();
      await run(
        'INSERT INTO cart_items (id, cart_id, product_id, size, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [itemId, cart.id, productId, size, numQty, now]
      );
    }

    await run('UPDATE cart SET updated_at = ? WHERE id = ?', [new Date().toISOString(), cart.id]);

    return res.status(201).json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    console.error('Error adding cart item:', err);
    return res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/v1/cart/items/:id
router.put('/items/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const numQty = parseInt(quantity, 10);
    if (isNaN(numQty) || numQty < 1) {
      // If quantity zero or invalid, delete item
      await run('DELETE FROM cart_items WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    await run('UPDATE cart_items SET quantity = ? WHERE id = ?', [numQty, id]);
    return res.json({ success: true, message: 'Quantity updated' });
  } catch (err) {
    console.error('Error updating cart item:', err);
    return res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/v1/cart/items/:id
router.delete('/items/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM cart_items WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    console.error('Error removing cart item:', err);
    return res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// DELETE /api/v1/cart/clear
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await get('SELECT id FROM cart WHERE user_id = ?', [userId]);
    if (cart) {
      await run('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    }
    return res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    console.error('Error clearing cart:', err);
    return res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
