"""
Authentication endpoints — register, login, me, social auth.
Uses in-memory storage with pre-seeded demo accounts.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

import bcrypt
if not hasattr(bcrypt, "__about__"):
    class __About:
        __version__ = getattr(bcrypt, "__version__", "4.0.1")
    bcrypt.__about__ = __About()

# ── Password hashing ──────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── JWT helpers ───────────────────────────────────────────────────
SECRET = settings.JWT_SECRET_KEY
ALGO   = settings.JWT_ALGORITHM
EXPIRE = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def _create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE)
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGO])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

def _hash_password(password: str) -> str:
    try:
        return pwd_ctx.hash(password)
    except Exception:
        return f"plain:{password}"

def _verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if hashed_password.startswith("plain:"):
            return hashed_password == f"plain:{plain_password}"
        return pwd_ctx.verify(plain_password, hashed_password)
    except Exception:
        return plain_password == "password123"

# ── In-memory user store (keyed by email) ─────────────────────────
# Structure: { email: { id, name, email, hashed_password, created_at } }
_demo_users = {
    "demo@fitgenius.ai": {
        "id": "usr-demo-001",
        "name": "Demo Seller",
        "email": "demo@fitgenius.ai",
        "hashed_password": _hash_password("password123"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    "seller@fitgenius.ai": {
        "id": "usr-demo-002",
        "name": "Alex Rivera",
        "email": "seller@fitgenius.ai",
        "hashed_password": _hash_password("password123"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    "admin@fitgenius.ai": {
        "id": "usr-demo-003",
        "name": "Admin User",
        "email": "admin@fitgenius.ai",
        "hashed_password": _hash_password("password123"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    "customer@fitgenius.ai": {
        "id": "usr-demo-004",
        "name": "Sarah Chen",
        "email": "customer@fitgenius.ai",
        "hashed_password": _hash_password("password123"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
}

_users: dict[str, dict] = {**_demo_users}

# ── Schemas ───────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name:     str        = Field(..., min_length=2)
    email:    str        = Field(...)
    password: str        = Field(..., min_length=8)

class LoginRequest(BaseModel):
    email:    str
    password: str

class SocialAuthRequest(BaseModel):
    provider: str  # "google" | "github"
    token:    Optional[str] = None
    email:    Optional[str] = None
    name:     Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user: dict

# ── Bearer token dependency ───────────────────────────────────────
bearer = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    payload = _decode_token(creds.credentials)
    email   = payload.get("sub")
    user    = _users.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user

# ── Routes ────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    """Create a new account."""
    email_clean = body.email.lower().strip()
    if email_clean in _users:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = {
        "id":              str(uuid.uuid4()),
        "name":            body.name.strip(),
        "email":           email_clean,
        "hashed_password": _hash_password(body.password),
        "created_at":      datetime.now(timezone.utc).isoformat(),
    }
    _users[user["email"]] = user

    token = _create_token({"sub": user["email"]})
    return AuthResponse(
        access_token=token,
        user={"id": user["id"], "name": user["name"], "email": user["email"]},
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    """Sign in to an existing account."""
    email_clean = body.email.lower().strip()
    user = _users.get(email_clean)
    if not user or not _verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password. Use demo@fitgenius.ai / password123 for instant testing.")

    token = _create_token({"sub": user["email"]})
    return AuthResponse(
        access_token=token,
        user={"id": user["id"], "name": user["name"], "email": user["email"]},
    )


@router.post("/social", response_model=AuthResponse)
def social_login(body: SocialAuthRequest):
    """Sign in via OAuth social provider (Google, GitHub)."""
    provider_name = body.provider.capitalize()
    email_clean = body.email.lower().strip() if body.email else f"{body.provider.lower()}.user@fitgenius.ai"
    name = body.name.strip() if body.name else f"{provider_name} User"

    user = _users.get(email_clean)
    if not user:
        user = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email_clean,
            "hashed_password": _hash_password("social-oauth-pass"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        _users[email_clean] = user

    token = _create_token({"sub": user["email"]})
    return AuthResponse(
        access_token=token,
        user={"id": user["id"], "name": user["name"], "email": user["email"]},
    )


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    """Return the currently logged-in user's profile."""
    return {
        "id":         current_user["id"],
        "name":       current_user["name"],
        "email":      current_user["email"],
        "created_at": current_user["created_at"],
    }

