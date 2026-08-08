const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { initDb } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// CORS setup to allow request from Next.js frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure uploads directory exists and serve statically
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Register REST API Routers under /api/v1
const productsRouter = require('./routes/products');
const reviewsRouter = require('./routes/reviews');
const sizeChartRouter = require('./routes/size_chart');
const recommendRouter = require('./routes/recommend');
const authRouter = require('./routes/auth');
const shopRouter = require('./routes/shop');
const wishlistRouter = require('./routes/wishlist');
const cartRouter = require('./routes/cart');
const checkoutRouter = require('./routes/checkout');
const paymentsRouter = require('./routes/payments');
const ordersRouter = require('./routes/orders');
const addressesRouter = require('./routes/addresses');
const chatRouter = require('./routes/chat');
const sellerDashboardRouter = require('./routes/seller_dashboard');

app.use('/api/v1/products', productsRouter);
app.use('/api/v1/products/:id/reviews', reviewsRouter);
app.use('/api/v1/size-chart', sizeChartRouter);
app.use('/api/v1/recommend', recommendRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/shop', shopRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/checkout', checkoutRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/addresses', addressesRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/seller/dashboard', sellerDashboardRouter);

// Health check endpoints
app.get(['/health', '/healthz'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'fitgenius-express-backend',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database and launch server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 FitGenius Express Backend running on http://localhost:${PORT}`);
      setInterval(() => {}, 60000);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
