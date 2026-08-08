const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const { run, get, all } = require('../db');
const { verifyToken } = require('../middleware/auth');
const { formatProduct } = require('./products');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_fitgenius_demo';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'fitgenius_demo_secret_key';

let razorpayInstance = null;
try {
  if (RAZORPAY_KEY_ID && !RAZORPAY_KEY_ID.includes('demo')) {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });
  }
} catch (e) {
  console.log('Razorpay init fallback to demo mode');
}

// POST /api/v1/checkout/create-order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId, shippingAddress } = req.body;

    // Fetch user cart
    const cart = await get('SELECT id FROM cart WHERE user_id = ?', [userId]);
    if (!cart) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItems = await all(`
      SELECT ci.id as item_id, ci.size, ci.quantity, p.*
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cart.id]);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Add products before checkout.' });
    }

    // Always calculate prices from DATABASE! Never trust frontend numbers.
    let totalMrp = 0;
    let subtotal = 0;
    const orderItemsPayload = [];

    for (const item of cartItems) {
      const formatted = formatProduct(item);
      const unitPrice = formatted.discountPrice || formatted.price;
      const itemSubtotal = unitPrice * item.quantity;

      totalMrp += (formatted.price * item.quantity);
      subtotal += itemSubtotal;

      orderItemsPayload.push({
        productId: item.id,
        sellerId: item.seller_id,
        size: item.size,
        quantity: item.quantity,
        price: unitPrice
      });
    }

    const discount = Math.max(0, totalMrp - subtotal);
    const deliveryCharge = subtotal > 1999 ? 0 : 99;
    const totalAmount = subtotal + deliveryCharge;

    // Get address string
    let finalAddressStr = typeof shippingAddress === 'string' ? shippingAddress : '';
    if (!finalAddressStr && addressId) {
      const addrRow = await get('SELECT * FROM addresses WHERE id = ?', [addressId]);
      if (addrRow) {
        finalAddressStr = `${addrRow.name}, ${addrRow.line1}, ${addrRow.line2 ? addrRow.line2 + ', ' : ''}${addrRow.city}, ${addrRow.state} - ${addrRow.pincode}. Phone: ${addrRow.phone}`;
      }
    }
    if (!finalAddressStr) {
      finalAddressStr = 'Default Address: Alex Johnson, Flat 402, Quantum Towers, Bengaluru, Karnataka - 560102. Phone: +91 98765 43210';
    }

    const orderId = `ord-${uuidv4().slice(0, 8)}`;
    const paymentId = `pay-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    // Create Order Record in SQLite DB
    await run(`
      INSERT INTO orders (id, user_id, total_amount, discount, delivery_charge, status, shipping_address, payment_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderId, userId, totalAmount, discount, deliveryCharge, 'Placed', finalAddressStr, paymentId, now, now]);

    // Create Order Items
    for (const item of orderItemsPayload) {
      const orderItemId = `oi-${uuidv4().slice(0, 8)}`;
      await run(`
        INSERT INTO order_items (id, order_id, product_id, seller_id, size, quantity, price, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderItemId, orderId, item.productId, item.sellerId, item.size, item.quantity, item.price, now]);
    }

    // Razorpay Order Creation
    let razorpayOrderId = `order_${uuidv4().slice(0, 14).replace(/-/g, '')}`;

    if (razorpayInstance) {
      try {
        const rzpOrder = await razorpayInstance.orders.create({
          amount: Math.round(totalAmount * 100), // in paise
          currency: 'INR',
          receipt: orderId,
          notes: { order_id: orderId, user_id: userId }
        });
        razorpayOrderId = rzpOrder.id;
      } catch (e) {
        console.log('Razorpay API error, using test mode order ID:', e.message);
      }
    }

    // Insert Payment Record
    await run(`
      INSERT INTO payments (id, order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [paymentId, orderId, razorpayOrderId, '', '', totalAmount, 'INR', 'Pending', 'Razorpay', now]);

    return res.status(201).json({
      success: true,
      orderId,
      razorpayOrderId,
      amount: totalAmount,
      amountPaise: Math.round(totalAmount * 100),
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      shippingAddress: finalAddressStr,
      summary: {
        totalMrp,
        subtotal,
        discount,
        deliveryCharge,
        totalAmount
      }
    });
  } catch (err) {
    console.error('Error creating order in checkout:', err);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
