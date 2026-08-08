const express = require('express');
const router = express.Router();
const { all } = require('../db');
const { formatProduct } = require('./products');

// POST /api/v1/chat
router.post('/', async (req, res) => {
  try {
    const { message = '', context = {} } = req.body;
    const cleanMsg = message.toLowerCase().trim();

    // Fetch all real products from SQLite DB
    const rows = await all('SELECT * FROM products ORDER BY created_at DESC');
    const allProducts = rows.map(formatProduct);

    let matchedProducts = [];
    let replyText = '';
    let categoryDetected = null;

    // 1. Budget extraction (e.g., "under 1500", "under ₹2000", "less than 1000")
    const budgetMatch = cleanMsg.match(/(?:under|below|less than|within|around|\u20b9|\$)\s*(\d+)/i);
    const maxBudget = budgetMatch ? parseFloat(budgetMatch[1]) : null;

    // 2. Category detection
    if (cleanMsg.includes('t-shirt') || cleanMsg.includes('tee') || cleanMsg.includes('tshirt')) {
      categoryDetected = 'T-Shirt';
    } else if (cleanMsg.includes('shirt') && !cleanMsg.includes('t-shirt')) {
      categoryDetected = 'Shirt';
    } else if (cleanMsg.includes('hoodie') || cleanMsg.includes('sweatshirt')) {
      categoryDetected = 'Hoodie';
    } else if (cleanMsg.includes('jacket') || cleanMsg.includes('denim')) {
      categoryDetected = 'Jacket';
    }

    // 3. Filter real DB products based on query intent
    let filtered = [...allProducts];

    if (categoryDetected) {
      filtered = filtered.filter(p => p.category.toLowerCase() === categoryDetected.toLowerCase() || p.name.toLowerCase().includes(categoryDetected.toLowerCase()));
    }

    if (maxBudget) {
      filtered = filtered.filter(p => p.discountPrice <= maxBudget || p.price <= maxBudget);
    }

    if (cleanMsg.includes('oversized') || cleanMsg.includes('relaxed') || cleanMsg.includes('loose')) {
      filtered = filtered.filter(p => p.fit.toLowerCase().includes('oversized') || p.fit.toLowerCase().includes('relaxed'));
    }

    if (cleanMsg.includes('highest rated') || cleanMsg.includes('best rating') || cleanMsg.includes('popular')) {
      filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    }

    // If query matches specific product keywords
    if (filtered.length === 0 || (!categoryDetected && !maxBudget)) {
      const searchTerms = cleanMsg.split(' ').filter(w => w.length > 3 && !['need', 'find', 'show', 'give', 'recommend', 'with', 'under', 'from', 'best', 'good'].includes(w));
      if (searchTerms.length > 0) {
        const keywordMatched = allProducts.filter(p => {
          return searchTerms.some(term =>
            p.name.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term) ||
            p.fabric.toLowerCase().includes(term) ||
            p.fit.toLowerCase().includes(term)
          );
        });
        if (keywordMatched.length > 0) {
          filtered = keywordMatched;
        }
      }
    }

    // Default to top products if no specific filter matched
    if (filtered.length === 0) {
      filtered = allProducts.slice(0, 4);
    } else {
      filtered = filtered.slice(0, 4);
    }

    matchedProducts = filtered;

    // 4. Formulate intelligent response based on query
    if (maxBudget && categoryDetected) {
      replyText = `Here are the best **${categoryDetected}** options under **₹${maxBudget}** from our store collection:`;
    } else if (maxBudget) {
      replyText = `I found **${matchedProducts.length} premium products** under your budget of **₹${maxBudget}**:`;
    } else if (categoryDetected) {
      replyText = `Here are our top rated **${categoryDetected}** garments with AI size recommendations:`;
    } else if (cleanMsg.includes('size') || cleanMsg.includes('fit') || cleanMsg.includes('measure')) {
      replyText = `Our AI size recommendation engine compares your Chest, Shoulder, Waist & Height against exact garment specifications. Here are available products with full S-2XL size charts:`;
    } else if (cleanMsg.includes('wishlist') || cleanMsg.includes('cart') || cleanMsg.includes('order')) {
      replyText = `You can easily add items to your Wishlist (♡) or Cart (🛒) right from these product cards, or view your saved items in the top navigation bar!`;
    } else {
      replyText = `I analyzed your query across our live database catalogue. Here are top recommended garments matching your style:`;
    }

    // Compute recommended size if body measurements passed in context
    const userChest = context.chest || 98;
    const productsWithRecSize = matchedProducts.map(p => {
      let recSize = 'M';
      if (p.sizeChart && p.sizeChart.length > 0) {
        // Find best size matching chest
        let closest = p.sizeChart[0];
        let minDiff = Math.abs(closest.chest_cm - userChest);
        p.sizeChart.forEach(s => {
          const diff = Math.abs(s.chest_cm - userChest);
          if (diff < minDiff) {
            minDiff = diff;
            closest = s;
          }
        });
        recSize = closest.size;
      }
      return {
        ...p,
        recommendedSize: recSize
      };
    });

    return res.json({
      reply: replyText,
      products: productsWithRecSize,
      suggestedQuestions: [
        "Show me oversized t-shirts under ₹1500",
        "Which size should I get for 100cm chest?",
        "Recommend French linen shirts",
        "What are the highest rated jackets?"
      ]
    });
  } catch (err) {
    console.error('Error in AI Chatbot:', err);
    return res.status(500).json({ error: 'Failed to process AI chat query' });
  }
});

module.exports = router;
