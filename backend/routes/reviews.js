const express = require('express');
const router = express.Router({ mergeParams: true });
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db');

// GET reviews for product
router.get('/', async (req, res) => {
  try {
    const { id: productId } = req.params;
    const reviews = await all('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [productId]);

    // Calculate rating distribution
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (counts[r.rating] !== undefined) {
        counts[r.rating]++;
      }
    });

    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : 0.0;

    return res.json({
      productId,
      averageRating: parseFloat(avg),
      totalReviews: total,
      distribution: counts,
      reviews: reviews.map(r => ({
        id: r.id,
        productId: r.product_id,
        userName: r.user_name,
        userAvatar: r.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at
      }))
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST submit review for product
router.post('/', async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { userName = 'Verified Buyer', userAvatar = '', rating, comment = '' } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const product = await get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const reviewId = `rev-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const avatar = userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

    await run(`
      INSERT INTO reviews (id, product_id, user_id, user_name, user_avatar, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [reviewId, productId, 'usr-customer', userName, avatar, rating, comment, now]);

    // Recalculate average rating & review count for product
    const stats = await get(`
      SELECT COUNT(*) as count, AVG(rating) as avg_rating
      FROM reviews
      WHERE product_id = ?
    `, [productId]);

    const newCount = stats.count || 0;
    const newAvg = stats.avg_rating ? parseFloat(stats.avg_rating.toFixed(1)) : 0.0;

    await run(`
      UPDATE products
      SET rating = ?, review_count = ?, updated_at = ?
      WHERE id = ?
    `, [newAvg, newCount, now, productId]);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        id: reviewId,
        productId,
        userName,
        userAvatar: avatar,
        rating,
        comment,
        createdAt: now
      },
      updatedProductStats: {
        averageRating: newAvg,
        reviewCount: newCount
      }
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
