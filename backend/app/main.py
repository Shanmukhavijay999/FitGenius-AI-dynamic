from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

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

# Register the v1 API router
app.include_router(api_router)

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
