from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import auth, size_chart, recommend

app = FastAPI(
    title="AI-Powered Size & Fit Chart Generator API",
    description="Enterprise SaaS API for automatic size chart generation and fit recommendation.",
    version="1.0.0",
)

# Set up CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoint routers directly under /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(size_chart.router, prefix="/api/v1")
app.include_router(recommend.router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint to verify backend service status.
    """
    return {
        "status": "healthy",
        "service": "fit-chart-generator-backend",
        "version": "1.0.0"
    }
