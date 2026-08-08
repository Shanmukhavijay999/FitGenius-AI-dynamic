"""
Review Endpoints
POST /api/v1/products/{id}/reviews  — Add a review (auto-updates product rating)
GET  /api/v1/products/{id}/reviews  — Get reviews + distribution stats
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.models import Product, Review

router = APIRouter(prefix="/products", tags=["Reviews"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ReviewCreate(BaseModel):
    user_name: str = Field(default="Anonymous", min_length=1)
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = ""


class ReviewOut(BaseModel):
    id: str
    product_id: str
    user_name: str
    rating: int
    comment: str
    created_at: str

    model_config = {"from_attributes": True}


class ReviewDistribution(BaseModel):
    star_5: int = 0
    star_4: int = 0
    star_3: int = 0
    star_2: int = 0
    star_1: int = 0


class ReviewsResponse(BaseModel):
    average_rating: float
    total_reviews: int
    distribution: ReviewDistribution
    reviews: list[ReviewOut]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/{product_id}/reviews", response_model=ReviewOut)
def add_review(
    product_id: str,
    body: ReviewCreate,
    db: Session = Depends(get_db),
):
    """Add a review and auto-update the product's aggregate rating."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    review = Review(
        id=str(uuid.uuid4()),
        product_id=product_id,
        user_name=body.user_name.strip(),
        rating=body.rating,
        comment=(body.comment or "").strip(),
    )
    db.add(review)

    # Recompute aggregate rating
    all_reviews = db.query(Review).filter(Review.product_id == product_id).all()
    all_reviews_list = list(all_reviews) + [review]
    total = len(all_reviews_list)
    avg = sum(r.rating for r in all_reviews_list) / total if total else 0.0

    product.rating = round(avg, 1)
    product.review_count = total

    db.commit()
    db.refresh(review)

    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        user_name=review.user_name,
        rating=review.rating,
        comment=review.comment or "",
        created_at=review.created_at.isoformat() if review.created_at else "",
    )


@router.get("/{product_id}/reviews", response_model=ReviewsResponse)
def get_reviews(product_id: str, db: Session = Depends(get_db)):
    """Get all reviews for a product with distribution stats."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    # Build distribution
    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        if r.rating in dist:
            dist[r.rating] += 1

    total = len(reviews)
    avg = sum(r.rating for r in reviews) / total if total else 0.0

    return ReviewsResponse(
        average_rating=round(avg, 1),
        total_reviews=total,
        distribution=ReviewDistribution(
            star_5=dist[5], star_4=dist[4], star_3=dist[3],
            star_2=dist[2], star_1=dist[1],
        ),
        reviews=[
            ReviewOut(
                id=r.id,
                product_id=r.product_id,
                user_name=r.user_name,
                rating=r.rating,
                comment=r.comment or "",
                created_at=r.created_at.isoformat() if r.created_at else "",
            )
            for r in reviews
        ],
    )
