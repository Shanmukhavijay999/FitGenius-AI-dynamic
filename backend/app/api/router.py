from fastapi import APIRouter
from app.api.endpoints import auth, size_chart, recommend

# Create the main API router with the v1 prefix
api_router = APIRouter(prefix="/api/v1")

# Register all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(size_chart.router)
api_router.include_router(recommend.router)
