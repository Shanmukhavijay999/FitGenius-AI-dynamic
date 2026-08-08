from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
from app.api.endpoints import auth, size_chart, recommend, products, reviews
import os

app = FastAPI(
    title="AI-Powered Size & Fit Chart Generator API",
    description="Enterprise SaaS API for automatic size chart generation and fit recommendation.",
    version="2.0.0",
)

# Set up CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded product images
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register endpoint routers directly under /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(size_chart.router, prefix="/api/v1")
app.include_router(recommend.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")

# Initialize database tables on startup
@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint to verify backend service status.
    """
    return {
        "status": "healthy",
        "service": "fit-chart-generator-backend",
        "version": "2.0.0"
    }
