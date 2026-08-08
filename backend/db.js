const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'fitgenius.db');

const db = new sqlite3.Database(DB_PATH);

// Helper for running queries with Promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables and migrations
async function initDb() {
  // Users table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT DEFAULT '',
      profile_image TEXT,
      phone TEXT DEFAULT '',
      role TEXT DEFAULT 'customer',
      created_at TEXT NOT NULL
    )
  `);

  // Products table
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL,
      seller_name TEXT NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      category TEXT NOT NULL,
      fabric TEXT NOT NULL,
      fit TEXT NOT NULL,
      price REAL DEFAULT 1299.0,
      discount_price REAL DEFAULT 999.0,
      description TEXT DEFAULT '',
      brand TEXT DEFAULT 'FitGenius Studio',
      tags TEXT DEFAULT '[]',
      size_chart TEXT NOT NULL,
      ai_insight TEXT DEFAULT '',
      rating REAL DEFAULT 4.8,
      review_count INTEGER DEFAULT 12,
      views INTEGER DEFAULT 120,
      favorites INTEGER DEFAULT 15,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Column Migrations for Products table
  try {
    const productCols = await all(`PRAGMA table_info(products)`);
    const colNames = productCols.map(c => c.name);
    if (!colNames.includes('price')) {
      await run(`ALTER TABLE products ADD COLUMN price REAL DEFAULT 1499.0`);
    }
    if (!colNames.includes('discount_price')) {
      await run(`ALTER TABLE products ADD COLUMN discount_price REAL DEFAULT 1199.0`);
    }
    if (!colNames.includes('description')) {
      await run(`ALTER TABLE products ADD COLUMN description TEXT DEFAULT ''`);
    }
    if (!colNames.includes('brand')) {
      await run(`ALTER TABLE products ADD COLUMN brand TEXT DEFAULT 'FitGenius Studio'`);
    }
  } catch (e) {
    console.log('Product column migration note:', e.message);
  }

  // Column Migrations for Users table
  try {
    const userCols = await all(`PRAGMA table_info(users)`);
    const userColNames = userCols.map(c => c.name);
    if (!userColNames.includes('password_hash')) {
      await run(`ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''`);
    }
    if (!userColNames.includes('phone')) {
      await run(`ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''`);
    }
  } catch (e) {
    console.log('User column migration note:', e.message);
  }

  // Reviews table
  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT DEFAULT 'usr-anon',
      user_name TEXT NOT NULL,
      user_avatar TEXT DEFAULT '',
      rating INTEGER NOT NULL,
      comment TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Wishlist table
  await run(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, product_id)
    )
  `);

  // Cart table
  await run(`
    CREATE TABLE IF NOT EXISTS cart (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Cart Items table
  await run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE
    )
  `);

  // Orders table
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      discount REAL DEFAULT 0.0,
      delivery_charge REAL DEFAULT 0.0,
      status TEXT DEFAULT 'Placed',
      shipping_address TEXT NOT NULL,
      payment_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Order Items table
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  // Payments table
  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'Pending',
      method TEXT DEFAULT 'Razorpay',
      created_at TEXT NOT NULL
    )
  `);

  // Addresses table
  await run(`
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT DEFAULT '',
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // Seed default seller user
  const seller = await get(`SELECT id FROM users WHERE id = ?`, ['usr-seller-001']);
  if (!seller) {
    await run(`
      INSERT INTO users (id, name, email, password_hash, profile_image, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'usr-seller-001',
      'Apex Apparel Studio',
      'seller@fitgenius.ai',
      '$2a$10$e0MYzXyjpJS7Pd0RVvHwHe9h3kC4ZkOQ6xK8G6yX8z1v7kM5jG8.', // hashed 'password123'
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      'seller',
      new Date().toISOString()
    ]);
  }

  // Seed default customer user
  const customer = await get(`SELECT id FROM users WHERE id = ?`, ['usr-customer-001']);
  if (!customer) {
    await run(`
      INSERT INTO users (id, name, email, password_hash, profile_image, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'usr-customer-001',
      'Alex Johnson',
      'alex@fitgenius.ai',
      '$2a$10$e0MYzXyjpJS7Pd0RVvHwHe9h3kC4ZkOQ6xK8G6yX8z1v7kM5jG8.', // hashed 'password123'
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
      'customer',
      new Date().toISOString()
    ]);

    // Seed customer default address
    await run(`
      INSERT INTO addresses (id, user_id, name, phone, line1, line2, city, state, pincode, is_default, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'addr-001',
      'usr-customer-001',
      'Alex Johnson',
      '+91 98765 43210',
      'Flat 402, Quantum Towers, HSR Layout',
      'Sector 3',
      'Bengaluru',
      'Karnataka',
      '560102',
      1,
      new Date().toISOString()
    ]);
  }

  // Seed default product if empty or 1
  const productCountObj = await get(`SELECT COUNT(*) as count FROM products`);
  if (!productCountObj || productCountObj.count === 0) {
    const initialChart = JSON.stringify([
      { size: "XS", chest_cm: 88, shoulder_cm: 41, length_cm: 67, waist_cm: 82, hip_cm: 88 },
      { size: "S", chest_cm: 94, shoulder_cm: 43, length_cm: 69, waist_cm: 88, hip_cm: 94 },
      { size: "M", chest_cm: 100, shoulder_cm: 45, length_cm: 71, waist_cm: 94, hip_cm: 100 },
      { size: "L", chest_cm: 106, shoulder_cm: 47, length_cm: 73, waist_cm: 100, hip_cm: 106 },
      { size: "XL", chest_cm: 112, shoulder_cm: 49, length_cm: 75, waist_cm: 106, hip_cm: 112 },
      { size: "2XL", chest_cm: 118, shoulder_cm: 51, length_cm: 77, waist_cm: 112, hip_cm: 118 }
    ]);
    const initialTags = JSON.stringify(["Premium Cotton", "Relaxed Fit", "Streetwear"]);

    const seedProducts = [
      {
        id: 'prod-showcase-001',
        seller_id: 'usr-seller-001',
        seller_name: 'Apex Apparel Studio',
        name: 'Minimalist Obsidian Oversized Tee',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
        category: 'T-Shirt',
        fabric: '100% Organic Heavyweight Cotton (240 GSM)',
        fit: 'Relaxed Oversized Fit',
        price: 1899.0,
        discount_price: 1299.0,
        description: 'Heavyweight organic cotton tee with dropped shoulders for a relaxed streetwear aesthetic.',
        brand: 'Apex Apparel',
        tags: initialTags,
        size_chart: initialChart,
        ai_insight: 'Crafted from 240 GSM organic cotton knit with high structural stability. Shoulder seam drops ~3.5cm creating a relaxed posture.',
        rating: 4.9,
        review_count: 128,
        views: 1420,
        favorites: 340
      },
      {
        id: 'prod-showcase-002',
        seller_id: 'usr-seller-001',
        seller_name: 'Apex Apparel Studio',
        name: 'Vintage Wash Utility Linen Shirt',
        image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
        category: 'Shirt',
        fabric: '100% Pure French Linen (180 GSM)',
        fit: 'Regular Fit',
        price: 2499.0,
        discount_price: 1799.0,
        description: 'Garment-dyed breathable linen shirt featuring dual chest utility pockets and natural texture.',
        brand: 'Apex Apparel',
        tags: JSON.stringify(["Linen", "Breathable", "Summer", "Utility"]),
        size_chart: initialChart,
        ai_insight: 'French flax linen construction with bio-wash softening. Tailored with 3cm ease around chest.',
        rating: 4.7,
        review_count: 84,
        views: 980,
        favorites: 210
      },
      {
        id: 'prod-showcase-003',
        seller_id: 'usr-seller-001',
        seller_name: 'Apex Apparel Studio',
        name: 'Cyberpunk Thermal Heavy Fleece Hoodie',
        image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
        category: 'Hoodie',
        fabric: '80% Cotton, 20% Recycled Fleece (380 GSM)',
        fit: 'Oversized Fit',
        price: 3499.0,
        discount_price: 2499.0,
        description: 'Ultra-dense 380 GSM fleece hoodie with double-lined hood and reinforced ribbing.',
        brand: 'FitGenius Studio',
        tags: JSON.stringify(["Fleece", "Heavyweight", "Winter", "Hoodie"]),
        size_chart: initialChart,
        ai_insight: 'Heavyweight fleece maintains shape under cold conditions. Recommended to order true to size for oversized look.',
        rating: 4.95,
        review_count: 210,
        views: 2400,
        favorites: 512
      },
      {
        id: 'prod-showcase-004',
        seller_id: 'usr-seller-001',
        seller_name: 'Apex Apparel Studio',
        name: 'Structured Raw Denim Trucker Jacket',
        image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=800',
        category: 'Jacket',
        fabric: '14oz Selvedge Raw Denim (100% Cotton)',
        fit: 'Tailored Fit',
        price: 4999.0,
        discount_price: 3499.0,
        description: 'Classic 14oz Japanese selvedge denim jacket with branded brass hardware and custom orange stitching.',
        brand: 'Apex Apparel',
        tags: JSON.stringify(["Denim", "Selvedge", "Outerwear", "Rugged"]),
        size_chart: initialChart,
        ai_insight: 'Raw denim stretches slightly after wear. Order true to chest width for a sharp silhouette.',
        rating: 4.8,
        review_count: 62,
        views: 750,
        favorites: 180
      }
    ];

    const now = new Date().toISOString();
    for (const p of seedProducts) {
      await run(`
        INSERT INTO products (
          id, seller_id, seller_name, name, image_url, category, fabric, fit, price, discount_price, description, brand, tags, size_chart, ai_insight, rating, review_count, views, favorites, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        p.id, p.seller_id, p.seller_name, p.name, p.image_url, p.category, p.fabric, p.fit,
        p.price, p.discount_price, p.description, p.brand, p.tags, p.size_chart, p.ai_insight,
        p.rating, p.review_count, p.views, p.favorites, now, now
      ]);
    }

    // Seed showcase reviews
    const reviews = [
      {
        id: 'rev-001',
        product_id: 'prod-showcase-001',
        user_name: 'Marcus Vance',
        user_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120',
        rating: 5,
        comment: 'The AI fit recommendation suggested Medium based on my chest and shoulder width, and it fits exactly like a dream! Super high quality heavy cotton.',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'rev-002',
        product_id: 'prod-showcase-001',
        user_name: 'Sophia Chen',
        user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        rating: 5,
        comment: 'Accurate size chart! Purchased Large for an oversized look as recommended by the alternative size note. Extremely satisfied.',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];

    for (const r of reviews) {
      await run(`
        INSERT INTO reviews (id, product_id, user_id, user_name, user_avatar, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [r.id, r.product_id, 'usr-customer-001', r.user_name, r.user_avatar, r.rating, r.comment, r.created_at]);
    }
  }

  console.log('Database initialized successfully at', DB_PATH);
}

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
