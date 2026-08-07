"""
Authentication endpoints — register, login, me.
Uses in-memory storage so no database is required for the demo.
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

# ── Password hashing ──────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── In-memory user store (keyed by email) ─────────────────────────
# Structure: { email: { id, name, email, hashed_password, created_at } }
_users: dict[str, dict] = {}

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

# ── Schemas ───────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name:     str        = Field(..., min_length=2)
    email:    str        = Field(...)
    password: str        = Field(..., min_length=8)

class LoginRequest(BaseModel):
    email:    str
    password: str

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
    if body.email in _users:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = {
        "id":              str(uuid.uuid4()),
        "name":            body.name.strip(),
        "email":           body.email.lower().strip(),
        "hashed_password": pwd_ctx.hash(body.password),
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
    user = _users.get(body.email.lower().strip())
    if not user or not pwd_ctx.verify(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

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
