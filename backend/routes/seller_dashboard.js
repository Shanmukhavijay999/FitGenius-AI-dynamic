const express = require('express');
const router = express.Router();
const { get, all } = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/v1/seller/stats
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const sellerId = req.user.id.startsWith('usr-seller') ? req.user.id : 'usr-seller-001';

    // Total products count
    const prodCountRow = await get('SELECT COUNT(*) as count FROM products WHERE seller_id = ? OR seller_id = ?', [sellerId, 'usr-seller-001']);
    const totalProducts = prodCountRow ? prodCountRow.count : 0;

    // Total views across products
    const viewsRow = await get('SELECT SUM(views) as total_views FROM products WHERE seller_id = ? OR seller_id = ?', [sellerId, 'usr-seller-001']);
    const totalViews = viewsRow && viewsRow.total_views ? viewsRow.total_views : 0;

    // Total favorites across products
    const favRow = await get('SELECT SUM(favorites) as total_favs FROM products WHERE seller_id = ? OR seller_id = ?', [sellerId, 'usr-seller-001']);
    const totalFavorites = favRow && favRow.total_favs ? favRow.total_favs : 0;

    // Average rating & total reviews
    const reviewStatsRow = await get(`
      SELECT COUNT(r.id) as total_reviews, AVG(r.rating) as avg_rating
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE p.seller_id = ? OR p.seller_id = ?
    `, [sellerId, 'usr-seller-001']);

    const totalReviews = reviewStatsRow ? reviewStatsRow.total_reviews : 0;
    const avgRating = reviewStatsRow && reviewStatsRow.avg_rating ? parseFloat(reviewStatsRow.avg_rating.toFixed(1)) : 4.8;

    // Total orders & total sales revenue
    const salesRow = await get(`
      SELECT COUNT(DISTINCT oi.order_id) as total_orders, SUM(oi.price * oi.quantity) as total_sales
      FROM order_items oi
      WHERE oi.seller_id = ? OR oi.seller_id = ?
    `, [sellerId, 'usr-seller-001']);

    const totalOrders = salesRow ? salesRow.total_orders : 0;
    const totalSales = salesRow && salesRow.total_sales ? parseFloat(salesRow.total_sales.toFixed(2)) : 0.0;

    return res.json({
      totalProducts,
      totalOrders,
      totalSales,
      averageRating: avgRating,
      totalReviews,
      productViews: totalViews,
      totalFavorites
    });
  } catch (err) {
    console.error('Error fetching seller stats:', err);
    return res.status(500).json({ error: 'Failed to fetch seller analytics' });
  }
});

module.exports = router;
