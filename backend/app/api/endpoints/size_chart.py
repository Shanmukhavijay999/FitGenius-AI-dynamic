"""
Size Chart Generation Endpoint
POST /api/v1/size-chart/generate

Accepts a garment image, sends it to Gemini Vision for analysis,
and returns a structured size chart with S/M/L/XL measurements.

Falls back to an intelligent mock if GEMINI_API_KEY is not set.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import Optional
import base64
import json
import re
import uuid
from datetime import datetime, timezone

from app.core.config import settings

router = APIRouter(prefix="/size-chart", tags=["Size Chart"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SizeEntry(BaseModel):
    size: str
    chest_cm: float
    shoulder_cm: float
    length_cm: float
    waist_cm: float
    hip_cm: float

class SizeChartResponse(BaseModel):
    chart_id: str
    garment_name: str
    garment_type: str
    fabric_type: str
    fit_style: str
    sizes: list[SizeEntry]
    ai_insight: str
    generated_at: str
    source: str  # "gemini" or "mock"


# ---------------------------------------------------------------------------
# Gemini Vision call
# ---------------------------------------------------------------------------

GEMINI_PROMPT = """
You are an expert fashion AI. Analyze this garment image carefully.

Return a JSON object with EXACTLY this structure (no markdown, no explanation — only raw JSON):
{
  "garment_name": "<descriptive product name>",
  "garment_type": "<T-Shirt|Shirt|Dress|Jacket|Pants|Shorts|Skirt|Hoodie|Blazer|Coat>",
  "fabric_type": "<Cotton|Polyester|Linen|Denim|Wool|Silk|Blend|Knit|Jersey>",
  "fit_style": "<Relaxed|Regular|Slim|Oversized|Tailored>",
  "sizes": [
    {"size": "XS", "chest_cm": 44, "shoulder_cm": 39, "length_cm": 62, "waist_cm": 36, "hip_cm": 44},
    {"size": "S",  "chest_cm": 48, "shoulder_cm": 41, "length_cm": 64, "waist_cm": 40, "hip_cm": 48},
    {"size": "M",  "chest_cm": 52, "shoulder_cm": 43, "length_cm": 66, "waist_cm": 44, "hip_cm": 52},
    {"size": "L",  "chest_cm": 56, "shoulder_cm": 45, "length_cm": 68, "waist_cm": 48, "hip_cm": 56},
    {"size": "XL", "chest_cm": 60, "shoulder_cm": 47, "length_cm": 70, "waist_cm": 52, "hip_cm": 60},
    {"size": "2XL","chest_cm": 64, "shoulder_cm": 49, "length_cm": 72, "waist_cm": 56, "hip_cm": 64}
  ],
  "ai_insight": "<one sentence about the garment key sizing characteristics>"
}

Adjust the measurements based on what you see in the image.
Use realistic garment dimensions (not body measurements).
Increment each size by 4 cm for chest/waist/hip, 2 cm for shoulder, 2 cm for length.
"""


def call_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """Call Gemini 1.5 Flash with the image and return parsed JSON."""
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        image_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": base64.b64encode(image_bytes).decode("utf-8"),
            }
        }

        response = model.generate_content([GEMINI_PROMPT, image_part])
        raw = response.text.strip()

        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        return json.loads(raw)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini Vision error: {str(exc)}"
        )


# ---------------------------------------------------------------------------
# Smart Mock fallback
# ---------------------------------------------------------------------------

MOCK_GARMENTS = [
    {
        "garment_name": "Classic Relaxed T-Shirt",
        "garment_type": "T-Shirt",
        "fabric_type": "Cotton",
        "fit_style": "Relaxed",
        "ai_insight": "Boxy relaxed silhouette with dropped shoulders — size down if you prefer a fitted look.",
        "base": {"chest": 48, "shoulder": 42, "length": 66, "waist": 46, "hip": 48},
    },
    {
        "garment_name": "Slim-Fit Oxford Shirt",
        "garment_type": "Shirt",
        "fabric_type": "Blend",
        "fit_style": "Slim",
        "ai_insight": "Slim through the chest with a tapered waist — true to size with minimal ease.",
        "base": {"chest": 46, "shoulder": 41, "length": 72, "waist": 42, "hip": 46},
    },
    {
        "garment_name": "Street-Style Hoodie",
        "garment_type": "Hoodie",
        "fabric_type": "Jersey",
        "fit_style": "Oversized",
        "ai_insight": "Oversized with extra length — for a true oversized look, stay true to size.",
        "base": {"chest": 54, "shoulder": 46, "length": 74, "waist": 52, "hip": 54},
    },
]

SIZES = ["XS", "S", "M", "L", "XL", "2XL"]

def make_mock_chart(garment: dict) -> list[dict]:
    b = garment["base"]
    result = []
    for i, sz in enumerate(SIZES):
        result.append({
            "size": sz,
            "chest_cm":    float(b["chest"]    + i * 4),
            "shoulder_cm": float(b["shoulder"] + i * 2),
            "length_cm":   float(b["length"]   + i * 2),
            "waist_cm":    float(b["waist"]    + i * 4),
            "hip_cm":      float(b["hip"]      + i * 4),
        })
    return result


def smart_mock(filename: str) -> dict:
    """Select a mock garment based on filename keywords (best effort)."""
    name_lower = filename.lower() if filename else ""
    if any(kw in name_lower for kw in ["shirt", "button", "oxford"]):
        g = MOCK_GARMENTS[1]
    elif any(kw in name_lower for kw in ["hoodie", "sweat", "hood"]):
        g = MOCK_GARMENTS[2]
    else:
        g = MOCK_GARMENTS[0]

    return {
        "garment_name": g["garment_name"],
        "garment_type": g["garment_type"],
        "fabric_type":  g["fabric_type"],
        "fit_style":    g["fit_style"],
        "ai_insight":   g["ai_insight"],
        "sizes":        make_mock_chart(g),
    }


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/generate", response_model=SizeChartResponse)
async def generate_size_chart(
    file: UploadFile = File(...),
    product_name: Optional[str] = Form(None),
):
    """
    Upload a garment image and receive a complete size chart.

    Uses Gemini Vision when GEMINI_API_KEY is configured, otherwise
    returns an intelligent mock chart for demo purposes.
    """
    # Validate file type
    mime = file.content_type or "image/jpeg"
    if mime not in ALLOWED_MIME:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{mime}'. Please upload JPEG, PNG, or WebP."
        )

    image_bytes = await file.read()
    if len(image_bytes) > 15 * 1024 * 1024:  # 15 MB limit
        raise HTTPException(status_code=413, detail="Image too large (max 15 MB).")

    # Determine source
    use_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

    if use_gemini:
        data = call_gemini(image_bytes, mime)
        source = "gemini"
    else:
        data = smart_mock(file.filename or product_name or "")
        source = "mock"

    # Override garment name if provided
    if product_name and product_name.strip():
        data["garment_name"] = product_name.strip()

    return SizeChartResponse(
        chart_id=str(uuid.uuid4()),
        garment_name=data.get("garment_name", "Untitled Garment"),
        garment_type=data.get("garment_type", "T-Shirt"),
        fabric_type=data.get("fabric_type", "Cotton"),
        fit_style=data.get("fit_style", "Regular"),
        sizes=[SizeEntry(**s) for s in data.get("sizes", [])],
        ai_insight=data.get("ai_insight", ""),
        generated_at=datetime.now(timezone.utc).isoformat(),
        source=source,
    )
