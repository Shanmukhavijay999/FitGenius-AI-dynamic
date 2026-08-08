const express = require('express');
const router = express.Router();
const { all, get } = require('../db');
const { formatProduct } = require('./products');

// GET /api/v1/shop
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      fit,
      fabric,
      size,
      min_price,
      max_price,
      min_rating,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR category LIKE ? OR fabric LIKE ? OR brand LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (fit && fit !== 'All') {
      sql += ' AND fit LIKE ?';
      params.push(`%${fit}%`);
    }

    if (fabric && fabric !== 'All') {
      sql += ' AND fabric LIKE ?';
      params.push(`%${fabric}%`);
    }

    if (min_price) {
      sql += ' AND (discount_price >= ? OR price >= ?)';
      params.push(parseFloat(min_price), parseFloat(min_price));
    }

    if (max_price) {
      sql += ' AND (discount_price <= ? OR price <= ?)';
      params.push(parseFloat(max_price), parseFloat(max_price));
    }

    if (min_rating) {
      sql += ' AND rating >= ?';
      params.push(parseFloat(min_rating));
    }

    // Sort order
    switch (sort) {
      case 'popular':
        sql += ' ORDER BY views DESC, favorites DESC';
        break;
      case 'price_low':
        sql += ' ORDER BY discount_price ASC';
        break;
      case 'price_high':
        sql += ' ORDER BY discount_price DESC';
        break;
      case 'rating':
        sql += ' ORDER BY rating DESC';
        break;
      case 'newest':
      default:
        sql += ' ORDER BY created_at DESC';
        break;
    }

    const rows = await all(sql, params);
    let formatted = rows.map(formatProduct);

    // Filter by size in memory if specified
    if (size && size !== 'All') {
      formatted = formatted.filter(p => {
        return p.sizes && p.sizes.includes(size.toUpperCase());
      });
    }

    const total = formatted.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = formatted.slice(startIndex, startIndex + limitNum);

    // Get unique metadata for filters dropdown
    const categories = Array.from(new Set(rows.map(r => r.category)));
    const fits = Array.from(new Set(rows.map(r => r.fit)));

    return res.json({
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      products: paginated,
      filterOptions: {
        categories,
        fits,
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL']
      }
    });
  } catch (err) {
    console.error('Error fetching shop products:', err);
    return res.status(500).json({ error: 'Failed to fetch shop products' });
  }
});

module.exports = router;
