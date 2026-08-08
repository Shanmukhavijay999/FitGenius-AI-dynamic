"""
Product CRUD Endpoints
POST   /api/v1/products          — Create product with image + size chart
GET    /api/v1/products          — List products (optional seller_id filter)
GET    /api/v1/products/{id}     — Get single product (increments views)
PUT    /api/v1/products/{id}     — Update product
DELETE /api/v1/products/{id}     — Delete product + image
POST   /api/v1/products/{id}/favorite — Toggle favorite count
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
import os
import uuid
import shutil

from app.core.database import get_db
from app.core.models import Product

router = APIRouter(prefix="/products", tags=["Products"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ProductOut(BaseModel):
    id: str
    seller_id: str
    seller_name: str
    name: str
    image_url: Optional[str] = None
    category: str
    fabric: str
    fit: str
    tags: list
    size_chart: list
    ai_insight: str
    rating: float
    review_count: int
    views: int
    favorites: int
    created_at: str

    model_config = {"from_attributes": True}


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    fabric: Optional[str] = None
    fit: Optional[str] = None


def _to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        seller_id=p.seller_id,
        seller_name=p.seller_name,
        name=p.name,
        image_url=f"/uploads/{p.image_path}" if p.image_path else None,
        category=p.category,
        fabric=p.fabric,
        fit=p.fit,
        tags=json.loads(p.tags) if p.tags else [],
        size_chart=json.loads(p.size_chart) if p.size_chart else [],
        ai_insight=p.ai_insight or "",
        rating=round(p.rating, 1),
        review_count=p.review_count,
        views=p.views,
        favorites=p.favorites,
        created_at=p.created_at.isoformat() if p.created_at else "",
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("", response_model=ProductOut)
async def create_product(
    file: UploadFile = File(...),
    name: str = Form(...),
    seller_id: str = Form("usr-demo-001"),
    seller_name: str = Form("Demo Seller"),
    category: str = Form("T-Shirt"),
    fabric: str = Form("Cotton"),
    fit: str = Form("Regular"),
    tags: str = Form("[]"),
    size_chart: str = Form("[]"),
    ai_insight: str = Form(""),
    db: Session = Depends(get_db),
):
    """Create a new product with image upload."""
    # Save image
    ext = os.path.splitext(file.filename or "img.jpg")[1] or ".jpg"
    image_filename = f"{uuid.uuid4().hex}{ext}"
    image_path = os.path.join(UPLOAD_DIR, image_filename)

    with open(image_path, "wb") as f:
        content = await file.read()
        f.write(content)

    product = Product(
        id=str(uuid.uuid4()),
        seller_id=seller_id,
        seller_name=seller_name,
        name=name,
        image_path=image_filename,
        category=category,
        fabric=fabric,
        fit=fit,
        tags=tags,
        size_chart=size_chart,
        ai_insight=ai_insight,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return _to_out(product)


@router.get("", response_model=list[ProductOut])
def list_products(
    seller_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all products, optionally filtered by seller_id."""
    query = db.query(Product).order_by(Product.created_at.desc())
    if seller_id:
        query = query.filter(Product.seller_id == seller_id)
    return [_to_out(p) for p in query.all()]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    """Get a single product by ID. Increments view count."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    # Increment views
    product.views += 1
    db.commit()
    db.refresh(product)
    return _to_out(product)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    body: ProductUpdate,
    db: Session = Depends(get_db),
):
    """Update product fields."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if body.name is not None:
        product.name = body.name
    if body.category is not None:
        product.category = body.category
    if body.fabric is not None:
        product.fabric = body.fabric
    if body.fit is not None:
        product.fit = body.fit

    db.commit()
    db.refresh(product)
    return _to_out(product)


@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    """Delete a product and its image."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Remove image file
    if product.image_path:
        img_path = os.path.join(UPLOAD_DIR, product.image_path)
        if os.path.exists(img_path):
            os.remove(img_path)

    db.delete(product)
    db.commit()
    return {"detail": "Product deleted successfully."}


@router.post("/{product_id}/favorite")
def toggle_favorite(product_id: str, db: Session = Depends(get_db)):
    """Increment favorite count."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    product.favorites += 1
    db.commit()
    return {"favorites": product.favorites}
