const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { run, get } = require('../db');
const { verifyToken } = require('../middleware/auth');

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'fitgenius_demo_secret_key';

// POST /api/v1/payments/verify
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_method = 'Razorpay'
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const order = await get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Signature verification if razorpay signature provided
    let isValidSignature = true;
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature && !RAZORPAY_KEY_SECRET.includes('demo')) {
      const generated_signature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValidSignature = generated_signature === razorpay_signature;
    }

    if (!isValidSignature) {
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    const now = new Date().toISOString();
    const payId = razorpay_payment_id || `pay_${Date.now()}`;

    // Update payment record
    await run(`
      UPDATE payments
      SET razorpay_order_id = ?, razorpay_payment_id = ?, razorpay_signature = ?, status = 'Paid', method = ?, created_at = ?
      WHERE order_id = ?
    `, [razorpay_order_id || '', payId, razorpay_signature || '', payment_method, now, orderId]);

    // Update order status to Confirmed
    await run(`
      UPDATE orders
      SET status = 'Confirmed', updated_at = ?
      WHERE id = ?
    `, [now, orderId]);

    // Clear user's cart
    const cart = await get('SELECT id FROM cart WHERE user_id = ?', [userId]);
    if (cart) {
      await run('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    }

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      orderId,
      paymentId: payId,
      status: 'Confirmed'
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// GET /api/v1/payments/:orderId
router.get('/:orderId', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await get('SELECT * FROM payments WHERE order_id = ?', [orderId]);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    return res.json(payment);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

module.exports = router;
