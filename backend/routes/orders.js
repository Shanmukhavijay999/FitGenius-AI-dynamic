const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { formatProduct } = require('./products');

// Helper to format order with items
async function formatOrderWithItems(order) {
  if (!order) return null;

  const itemRows = await all(`
    SELECT oi.*, p.name as product_name, p.image_url, p.category, p.brand
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `, [order.id]);

  const items = itemRows.map(i => {
    let finalImageUrl = i.image_url;
    if (!finalImageUrl.startsWith('http') && !finalImageUrl.startsWith('/uploads')) {
      finalImageUrl = `/uploads/${finalImageUrl}`;
    }
    return {
      id: i.id,
      productId: i.product_id,
      sellerId: i.seller_id,
      productName: i.product_name,
      category: i.category,
      brand: i.brand,
      imageUrl: finalImageUrl,
      size: i.size,
      quantity: i.quantity,
      price: i.price,
      subtotal: i.price * i.quantity
    };
  });

  const payment = await get('SELECT * FROM payments WHERE order_id = ?', [order.id]);

  // Order status timeline steps
  const STATUSES = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentIdx = STATUSES.indexOf(order.status) !== -1 ? STATUSES.indexOf(order.status) : 0;

  return {
    id: order.id,
    userId: order.user_id,
    totalAmount: order.total_amount,
    discount: order.discount || 0,
    deliveryCharge: order.delivery_charge || 0,
    status: order.status || 'Placed',
    statusIndex: currentIdx,
    timeline: STATUSES.map((s, idx) => ({
      status: s,
      completed: idx <= currentIdx,
      current: idx === currentIdx
    })),
    shippingAddress: order.shipping_address,
    paymentStatus: payment ? payment.status : 'Pending',
    paymentMethod: payment ? payment.method : 'Razorpay',
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items
  };
}

// GET /api/v1/orders (Customer orders)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const formatted = await Promise.all(orders.map(formatOrderWithItems));
    return res.json(formatted);
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/v1/orders/seller/all (Seller orders)
router.get('/seller/all', verifyToken, async (req, res) => {
  try {
    const sellerId = req.user.id.startsWith('usr-seller') ? req.user.id : 'usr-seller-001';

    // Get orders containing seller's products
    const orderRows = await all(`
      SELECT DISTINCT o.*
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.seller_id = ? OR oi.seller_id = 'usr-seller-001'
      ORDER BY o.created_at DESC
    `, [sellerId]);

    const formatted = await Promise.all(orderRows.map(formatOrderWithItems));
    return res.json(formatted);
  } catch (err) {
    console.error('Error fetching seller orders:', err);
    return res.status(500).json({ error: 'Failed to fetch seller orders' });
  }
});

// GET /api/v1/orders/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const formatted = await formatOrderWithItems(order);
    return res.json(formatted);
  } catch (err) {
    console.error('Error fetching order details:', err);
    return res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// PUT /api/v1/orders/:id/status (Seller updates order status)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const VALID_STATUSES = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const now = new Date().toISOString();
    await run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);

    const updated = await get('SELECT * FROM orders WHERE id = ?', [id]);
    const formatted = await formatOrderWithItems(updated);

    return res.json({
      success: true,
      message: `Order status updated to "${status}"`,
      order: formatted
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
