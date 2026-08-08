# 🛍️ FitGenius AI — AI-Powered Fashion Shopping Platform

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Shanmukhavijay999/FitGenius-AI-dynamic)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.0-black?logo=next.js)](https://nextjs.org/)
[![Node.js Express](https://img.shields.io/badge/Express-4.19-green?logo=express)](https://expressjs.com/)
[![SQLite DB](https://img.shields.io/badge/Database-SQLite-blue?logo=sqlite)](https://www.sqlite.org/)
[![Gemini Vision AI](https://img.shields.io/badge/AI-Google_Gemini_Vision-purple?logo=google)](https://ai.google.dev/)
[![Razorpay Payments](https://img.shields.io/badge/Payment-Razorpay_UPI-blueviolet?logo=razorpay)](https://razorpay.com/)

---

## 🌐 Live URLs & Deployment Links

- **GitHub Repository**: [https://github.com/Shanmukhavijay999/FitGenius-AI-dynamic.git](https://github.com/Shanmukhavijay999/FitGenius-AI-dynamic.git)
- **Render Live Backend**: [https://fitgenius-ai-backend.onrender.com](https://fitgenius-ai-backend.onrender.com)
- **Vercel Live Frontend**: [https://fitgenius-ai-dynamic.vercel.app](https://fitgenius-ai-dynamic.vercel.app)

---

## 🚀 How to Deploy on Render (Step-by-Step)

### Option 1: Automatic 1-Click Render Deployment (Recommended)
Click the button below to automatically import `render.yaml` Blueprint into your Render account:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Shanmukhavijay999/FitGenius-AI-dynamic)

### Option 2: Manual Render Dashboard Setup
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/Shanmukhavijay999/FitGenius-AI-dynamic.git`.
3. Configure the Web Service fields:
   - **Name**: `fitgenius-ai-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add Environment Variables under **Advanced**:
   - `PORT` = `10000`
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = *your_gemini_api_key*
   - `JWT_SECRET_KEY` = `super_secret_key_fitgenius_2026`
   - `RAZORPAY_KEY_ID` = `rzp_test_fitgenius_demo`
   - `RAZORPAY_KEY_SECRET` = `fitgenius_demo_secret_key`
5. Click **Create Web Service**. Render will build and deploy your backend live!

---

## 📖 System Architecture Diagram

```mermaid
graph TD
    subgraph Client ["Frontend (Next.js 16 + React 19 + Framer Motion)"]
        UI[User Interface & Dark Theme]
        Navbar[Navbar + Role Switcher]
        ShopPage[Shop Catalogue /shop]
        ProdDetail[Product Details /products/id]
        SizeRec[AI Size Finder /recommend]
        WishlistPage[Wishlist /wishlist]
        CartPage[Cart /cart]
        CheckoutPage[Checkout & Razorpay Modal /checkout]
        OrdersPage[My Orders Timeline /orders]
        SellerDash[Seller Dashboard /seller/products]
        AIChat[Floating Ask AI Chatbot]
    end

    subgraph Server ["Backend (Node.js Express API - Port 8001 / Render 10000)"]
        AuthMiddleware[JWT Auth Middleware]
        ProductsRouter[/api/v1/products]
        ShopRouter[/api/v1/shop]
        WishlistRouter[/api/v1/wishlist]
        CartRouter[/api/v1/cart]
        CheckoutRouter[/api/v1/checkout]
        PaymentsRouter[/api/v1/payments]
        OrdersRouter[/api/v1/orders]
        ChatRouter[/api/v1/chat]
        SizeChartRouter[/api/v1/size-chart]
        RecommendRouter[/api/v1/recommend]
        SellerStatsRouter[/api/v1/seller/dashboard]
    end

    subgraph External ["AI & Payment Services"]
        Gemini[Google Gemini Vision API]
        Razorpay[Razorpay Payment SDK & Scannable UPI QR]
    end

    subgraph Database ["SQLite Persistent Database"]
        DB[(fitgenius.db)]
    end

    UI --> Server
    AIChat --> ChatRouter
    ChatRouter --> DB
    ChatRouter --> Gemini
    SizeChartRouter --> Gemini
    CheckoutPage --> CheckoutRouter
    CheckoutRouter --> Razorpay
    PaymentsRouter --> DB
    ProductsRouter --> DB
    ShopRouter --> DB
    WishlistRouter --> DB
    CartRouter --> DB
    OrdersRouter --> DB
```

---

## 🔄 E-Commerce Workflow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    actor Customer
    participant Frontend as Next.js 16 App
    participant Express as Express Backend (Render)
    participant Gemini as Gemini Vision AI
    participant DB as SQLite DB
    participant Razorpay as Razorpay / UPI

    Seller->>Frontend: Upload flat-lay garment photo
    Frontend->>Express: POST /api/v1/size-chart/generate
    Express->>Gemini: Analyze image dimensions & seams
    Gemini-->>Express: Returns S/M/L/XL size chart JSON
    Express->>DB: Save product to products table
    DB-->>Frontend: Product created & live in Shop catalog

    Customer->>Frontend: Open Shop (/shop) or Product Page
    Customer->>Frontend: Input body measurements (Chest, Shoulder, Height)
    Frontend->>Express: POST /api/v1/recommend
    Express-->>Frontend: Returns recommended size (e.g. Size L - 97% Match)

    Customer->>Frontend: Click "Add to Cart" or "♡ Wishlist"
    Frontend->>Express: POST /api/v1/cart/items
    Express->>DB: Save cart_items in SQLite

    Customer->>Frontend: Click "Proceed to Checkout"
    Frontend->>Express: POST /api/v1/checkout/create-order
    Express->>DB: Server calculates totals & creates order record
    Express-->>Frontend: Returns orderId & razorpayOrderId

    Frontend->>Customer: Display Scannable UPI QR Code Modal
    Customer->>Razorpay: Scan QR code with GPay/PhonePe or Pay
    Frontend->>Express: POST /api/v1/payments/verify
    Express->>DB: Verify signature & update status to PAID & Confirmed
    Express->>DB: Clear customer cart
    Express-->>Frontend: Order confirmation success

    Customer->>Frontend: View delivery status in My Orders (/orders)
    Seller->>Frontend: View order in Seller Studio & update status (Placed -> Delivered)
```

---

## 🗄️ Database Entity-Relationship (ER) Schema Diagram

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : uploads
    USERS ||--o{ WISHLIST : saves
    USERS ||--o{ CART : owns
    USERS ||--o{ ORDERS : places
    USERS ||--o{ ADDRESSES : owns
    CART ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : added_in
    PRODUCTS ||--o{ WISHLIST : wishlisted_in
    PRODUCTS ||--o{ REVIEWS : receives
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--|| PAYMENTS : has
    PRODUCTS ||--o{ ORDER_ITEMS : ordered_as

    USERS {
        string id PK
        string name
        string email UK
        string password_hash
        string role
        string phone
        string created_at
    }

    PRODUCTS {
        string id PK
        string seller_id FK
        string name
        string image_url
        string category
        string fabric
        string fit
        float price
        float discount_price
        string brand
        string size_chart
        string ai_insight
        float rating
        int review_count
        int views
        int favorites
    }

    WISHLIST {
        string id PK
        string user_id FK
        string product_id FK
        string created_at
    }

    CART {
        string id PK
        string user_id FK
        string created_at
    }

    CART_ITEMS {
        string id PK
        string cart_id FK
        string product_id FK
        string size
        int quantity
    }

    ORDERS {
        string id PK
        string user_id FK
        float total_amount
        float discount
        float delivery_charge
        string status
        string shipping_address
        string payment_id
        string created_at
    }

    PAYMENTS {
        string id PK
        string order_id FK
        string razorpay_order_id
        string razorpay_payment_id
        string razorpay_signature
        float amount
        string status
        string method
    }
```

---

## 🔌 API Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/shop` | Public catalog with filters, search, sorting & pagination |
| `GET` | `/api/v1/products` | Get all products |
| `GET` | `/api/v1/products/:id` | Get product details & increment view count |
| `POST` | `/api/v1/products` | Create product with image upload |
| `PUT` | `/api/v1/products/:id` | Update product details |
| `DELETE` | `/api/v1/products/:id` | Permanently delete product |
| `POST` | `/api/v1/size-chart/generate` | AI Gemini size chart extraction |
| `POST` | `/api/v1/recommend` | Calculate customer size recommendation |
| `GET` | `/api/v1/wishlist` | Get saved wishlist items |
| `POST` | `/api/v1/wishlist` | Add product to wishlist |
| `DELETE` | `/api/v1/wishlist/:id` | Remove product from wishlist |
| `GET` | `/api/v1/cart` | Get cart with calculated totals |
| `POST` | `/api/v1/cart/items` | Add item to cart |
| `PUT` | `/api/v1/cart/items/:id` | Update item quantity |
| `DELETE` | `/api/v1/cart/items/:id` | Remove item from cart |
| `POST` | `/api/v1/checkout/create-order` | Server-validated checkout & Razorpay order creation |
| `POST` | `/api/v1/payments/verify` | Verify Razorpay payment signature & confirm order |
| `GET` | `/api/v1/orders` | Customer order history & tracking timeline |
| `GET` | `/api/v1/orders/seller/all` | Seller order fulfilment list |
| `PUT` | `/api/v1/orders/:id/status` | Update delivery status |
| `POST` | `/api/v1/chat` | AI Shopping Assistant DB query chatbot |

---

## ⚙️ Local Setup & Running

```bash
# Clone Repository
git clone https://github.com/Shanmukhavijay999/FitGenius-AI-dynamic.git
cd FitGenius-AI-dynamic

# Start Development Server
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8001/api/v1](http://localhost:8001/api/v1)

---

## 📜 License

Distributed under the **MIT License**.
