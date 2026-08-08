const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db');

// File Upload Config
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

function formatProduct(p) {
  if (!p) return null;
  let tagsArr = [];
  let sizeChartArr = [];
  try {
    tagsArr = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags || [];
  } catch (e) {
    tagsArr = [];
  }
  try {
    sizeChartArr = typeof p.size_chart === 'string' ? JSON.parse(p.size_chart) : p.size_chart || [];
  } catch (e) {
    sizeChartArr = [];
  }

  // Construct absolute/relative static image URL
  let finalImageUrl = p.image_url;
  if (!finalImageUrl.startsWith('http') && !finalImageUrl.startsWith('/uploads')) {
    finalImageUrl = `/uploads/${finalImageUrl}`;
  }

  const availableSizes = sizeChartArr.map(s => s.size);

  return {
    id: p.id,
    sellerId: p.seller_id,
    seller_id: p.seller_id,
    sellerName: p.seller_name,
    seller_name: p.seller_name,
    name: p.name,
    imageUrl: finalImageUrl,
    image_url: finalImageUrl,
    category: p.category,
    fabric: p.fabric,
    fit: p.fit,
    price: parseFloat(p.price || 1499.0),
    discountPrice: parseFloat(p.discount_price || p.price || 1199.0),
    discount_price: parseFloat(p.discount_price || p.price || 1199.0),
    description: p.description || '',
    brand: p.brand || 'FitGenius Studio',
    tags: tagsArr,
    sizeChart: sizeChartArr,
    size_chart: sizeChartArr,
    sizes: availableSizes.length > 0 ? availableSizes : ['S', 'M', 'L', 'XL'],
    aiInsight: p.ai_insight || '',
    ai_insight: p.ai_insight || '',
    rating: parseFloat(p.rating || 4.8).toFixed(1),
    averageRating: parseFloat(p.rating || 4.8).toFixed(1),
    reviewCount: parseInt(p.review_count || 0, 10),
    review_count: parseInt(p.review_count || 0, 10),
    views: parseInt(p.views || 0, 10),
    favorites: parseInt(p.favorites || 0, 10),
    createdAt: p.created_at,
    created_at: p.created_at,
    updatedAt: p.updated_at,
    updated_at: p.updated_at
  };
}

// GET all products
router.get('/', async (req, res) => {
  try {
    const { seller_id, category, search } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (seller_id) {
      sql += ' AND seller_id = ?';
      params.push(seller_id);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR category LIKE ? OR fabric LIKE ? OR brand LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await all(sql, params);
    const products = rows.map(formatProduct);
    return res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await run('UPDATE products SET views = views + 1 WHERE id = ?', [id]);
    product.views += 1;

    return res.json(formatProduct(product));
  } catch (err) {
    console.error('Error fetching product details:', err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST create product
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const {
      name,
      seller_id = 'usr-seller-001',
      seller_name = 'Apex Apparel Studio',
      category = 'T-Shirt',
      fabric = '100% Cotton',
      fit = 'Regular',
      price = 1499.0,
      discount_price = 1199.0,
      description = '',
      brand = 'FitGenius Studio',
      tags = '[]',
      size_chart = '[]',
      ai_insight = ''
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      imageUrl = req.body.image_url;
    } else {
      imageUrl = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800';
    }

    const productId = `prod-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    const formattedTags = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
    const formattedChart = typeof size_chart === 'string' ? size_chart : JSON.stringify(size_chart || []);

    const numPrice = parseFloat(price) || 1499.0;
    const numDiscount = parseFloat(discount_price) || numPrice;

    await run(`
      INSERT INTO products (
        id, seller_id, seller_name, name, image_url, category, fabric, fit, price, discount_price, description, brand, tags, size_chart, ai_insight, rating, review_count, views, favorites, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      productId,
      seller_id,
      seller_name,
      name,
      imageUrl,
      category,
      fabric,
      fit,
      numPrice,
      numDiscount,
      description,
      brand,
      formattedTags,
      formattedChart,
      ai_insight,
      5.0,
      0,
      1,
      0,
      now,
      now
    ]);

    const created = await get('SELECT * FROM products WHERE id = ?', [productId]);
    return res.status(201).json(formatProduct(created));
  } catch (err) {
    console.error('Error creating product:', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      name = existing.name,
      category = existing.category,
      fabric = existing.fabric,
      fit = existing.fit,
      price = existing.price,
      discount_price = existing.discount_price,
      description = existing.description,
      brand = existing.brand,
      tags = existing.tags,
      size_chart = existing.size_chart,
      ai_insight = existing.ai_insight
    } = req.body;

    const formattedTags = typeof tags === 'string' ? tags : JSON.stringify(tags);
    const formattedChart = typeof size_chart === 'string' ? size_chart : JSON.stringify(size_chart);
    const now = new Date().toISOString();

    await run(`
      UPDATE products
      SET name = ?, category = ?, fabric = ?, fit = ?, price = ?, discount_price = ?, description = ?, brand = ?, tags = ?, size_chart = ?, ai_insight = ?, updated_at = ?
      WHERE id = ?
    `, [name, category, fabric, fit, price, discount_price, description, brand, formattedTags, formattedChart, ai_insight, now, id]);

    const updated = await get('SELECT * FROM products WHERE id = ?', [id]);
    return res.json(formatProduct(updated));
  } catch (err) {
    console.error('Error updating product:', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existing.image_url && existing.image_url.startsWith('/uploads/')) {
      const filename = path.basename(existing.image_url);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await run('DELETE FROM reviews WHERE product_id = ?', [id]);
    await run('DELETE FROM products WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Product deleted permanently' });
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST toggle favorite
router.post('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await run('UPDATE products SET favorites = favorites + 1 WHERE id = ?', [id]);
    const updated = await get('SELECT favorites FROM products WHERE id = ?', [id]);
    return res.json({ favorites: updated.favorites });
  } catch (err) {
    console.error('Error toggling favorite:', err);
    return res.status(500).json({ error: 'Failed to favorite product' });
  }
});

module.exports = router;
module.exports.formatProduct = formatProduct;
