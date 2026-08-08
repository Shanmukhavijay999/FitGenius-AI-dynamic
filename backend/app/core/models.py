"""
SQLAlchemy models for Products, Reviews, and Users.
"""

from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=_uuid)
    seller_id = Column(String, nullable=False, default="usr-demo-001")
    seller_name = Column(String, nullable=False, default="Demo Seller")
    name = Column(String, nullable=False)
    image_path = Column(String, nullable=True)  # relative path in uploads/
    category = Column(String, nullable=False, default="T-Shirt")
    fabric = Column(String, nullable=False, default="Cotton")
    fit = Column(String, nullable=False, default="Regular")
    tags = Column(Text, nullable=True, default="[]")  # JSON array
    size_chart = Column(Text, nullable=False, default="[]")  # JSON array
    ai_insight = Column(Text, nullable=True, default="")
    rating = Column(Float, nullable=False, default=0.0)
    review_count = Column(Integer, nullable=False, default=0)
    views = Column(Integer, nullable=False, default=0)
    favorites = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=_uuid)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String, nullable=False, default="Anonymous")
    user_avatar = Column(String, nullable=True, default="")
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="reviews")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    profile_image = Column(String, nullable=True, default="")
    role = Column(String, nullable=False, default="customer")  # "seller" or "customer"
    password_hash = Column(String, nullable=True, default="")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

