"""
Fit Recommendation Endpoint
POST /api/v1/recommend

Accepts customer body measurements + a garment size chart,
applies a weighted scoring algorithm, and returns:
 - Recommended size
 - Confidence score (%)
 - Per-dimension match scores
 - AI explanation text
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
import math

router = APIRouter(prefix="/recommend", tags=["Recommendation"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BodyMeasurements(BaseModel):
    height_cm: float = Field(..., ge=100, le=250, description="Customer height in cm")
    weight_kg: float = Field(..., ge=30, le=300, description="Customer weight in kg")
    chest_cm: float  = Field(..., ge=50, le=180, description="Chest circumference in cm")
    waist_cm: float  = Field(..., ge=40, le=180, description="Waist circumference in cm")
    hip_cm: Optional[float] = Field(None, ge=50, le=200, description="Hip circumference in cm")
    shoulder_cm: Optional[float] = Field(None, ge=30, le=70, description="Shoulder width in cm")


class GarmentSizeEntry(BaseModel):
    size: str
    chest_cm: float
    shoulder_cm: Optional[float] = None
    length_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hip_cm: Optional[float] = None


class RecommendRequest(BaseModel):
    body: BodyMeasurements
    sizes: list[GarmentSizeEntry]
    garment_type: Optional[str] = "T-Shirt"
    fit_style: Optional[str] = "Regular"
    garment_name: Optional[str] = ""


class DimensionScore(BaseModel):
    dimension: str
    body_cm: float
    garment_cm: float
    match_pct: float
    note: str


class RecommendResponse(BaseModel):
    recommended_size: str
    confidence_pct: float
    fit_description: str
    ai_explanation: str
    dimension_scores: list[DimensionScore]
    alternative_size: Optional[str] = None
    alternative_note: Optional[str] = None


# ---------------------------------------------------------------------------
# Fit ease constants (how much ease to add on top of body measurement)
# These approximate industry standard garment ease per fit style.
# ---------------------------------------------------------------------------

EASE = {
    "Relaxed":   {"chest": 14, "waist": 16, "hip": 12, "shoulder": 1.5},
    "Oversized": {"chest": 20, "waist": 22, "hip": 18, "shoulder": 3.0},
    "Regular":   {"chest": 8,  "waist": 10, "hip": 8,  "shoulder": 1.0},
    "Slim":      {"chest": 4,  "waist": 6,  "hip": 5,  "shoulder": 0.5},
    "Tailored":  {"chest": 3,  "waist": 4,  "hip": 4,  "shoulder": 0.0},
}

# Dimension weights for scoring (must sum to 1.0)
DIM_WEIGHTS = {
    "chest":    0.45,
    "waist":    0.25,
    "shoulder": 0.20,
    "hip":      0.10,
}

# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def _ease_for(fit_style: str, dim: str) -> float:
    return EASE.get(fit_style, EASE["Regular"]).get(dim, 8)


def _score_dimension(body: float, garment: float, ease: float, weight: float) -> tuple[float, str]:
    """
    Score how well the garment dimension fits body + ease.
    Returns (weighted_score, note).
    """
    target = body + ease
    diff = garment - target  # positive = loose, negative = tight

    if diff < -4:
        note = "Too tight"
        raw = max(0.0, 1.0 + diff / 8)  # severe penalty
    elif diff < 0:
        note = "Slightly snug"
        raw = 0.85 + (diff / 4) * 0.15
    elif diff <= 4:
        note = "Perfect fit"
        raw = 1.0 - (diff / 4) * 0.05
    elif diff <= 8:
        note = "Slightly loose"
        raw = 0.90 - ((diff - 4) / 4) * 0.10
    else:
        note = "Too loose"
        raw = max(0.60, 0.80 - (diff - 8) / 20)

    raw = max(0.0, min(1.0, raw))
    return raw * weight, note


def _build_explanation(
    body: BodyMeasurements,
    recommended: GarmentSizeEntry,
    alternative: Optional[GarmentSizeEntry],
    fit_style: str,
    garment_name: str,
    confidence: float,
) -> str:
    fit_desc = fit_style.lower()
    size = recommended.size
    chest = recommended.chest_cm

    # Build personalized explanation
    parts = [
        f"Size {size} is your best match with a {confidence:.0f}% confidence score.",
        f"The {chest:.0f} cm chest measurement provides the right amount of ease "
        f"for a {fit_desc} fit against your {body.chest_cm:.0f} cm chest.",
    ]

    if body.waist_cm and recommended.waist_cm:
        waist_diff = recommended.waist_cm - body.waist_cm
        if waist_diff > 0:
            parts.append(
                f"The waist sits {waist_diff:.0f} cm easy — comfortable without being baggy."
            )

    if alternative:
        parts.append(
            f"Size {alternative.size} is a viable alternative if you prefer a "
            f"{'tighter' if alternative.size < size else 'more relaxed'} feel."
        )

    if garment_name:
        parts.append(f"This analysis is based on the '{garment_name}' size chart.")

    return " ".join(parts)


# ---------------------------------------------------------------------------
# Core recommendation logic
# ---------------------------------------------------------------------------

def recommend(req: RecommendRequest) -> RecommendResponse:
    body = req.body
    fit_style = req.fit_style or "Regular"

    best_size: Optional[GarmentSizeEntry] = None
    best_score = -1.0
    second_size: Optional[GarmentSizeEntry] = None
    second_score = -1.0

    all_scores: dict[str, list[DimensionScore]] = {}

    for entry in req.sizes:
        total_score = 0.0
        dim_scores: list[DimensionScore] = []

        # --- Chest (required) ---
        w, note = _score_dimension(
            body.chest_cm, entry.chest_cm,
            _ease_for(fit_style, "chest"), DIM_WEIGHTS["chest"]
        )
        total_score += w
        dim_scores.append(DimensionScore(
            dimension="Chest",
            body_cm=body.chest_cm,
            garment_cm=entry.chest_cm,
            match_pct=round((w / DIM_WEIGHTS["chest"]) * 100, 1),
            note=note,
        ))

        # --- Waist (optional) ---
        if body.waist_cm and entry.waist_cm:
            w2, note2 = _score_dimension(
                body.waist_cm, entry.waist_cm,
                _ease_for(fit_style, "waist"), DIM_WEIGHTS["waist"]
            )
            total_score += w2
            dim_scores.append(DimensionScore(
                dimension="Waist",
                body_cm=body.waist_cm,
                garment_cm=entry.waist_cm,
                match_pct=round((w2 / DIM_WEIGHTS["waist"]) * 100, 1),
                note=note2,
            ))
        else:
            # Chest already weighted higher without waist
            total_score += DIM_WEIGHTS["waist"] * 0.85  # neutral bonus

        # --- Shoulder (optional) ---
        if body.shoulder_cm and entry.shoulder_cm:
            w3, note3 = _score_dimension(
                body.shoulder_cm, entry.shoulder_cm,
                _ease_for(fit_style, "shoulder"), DIM_WEIGHTS["shoulder"]
            )
            total_score += w3
            dim_scores.append(DimensionScore(
                dimension="Shoulder",
                body_cm=body.shoulder_cm,
                garment_cm=entry.shoulder_cm,
                match_pct=round((w3 / DIM_WEIGHTS["shoulder"]) * 100, 1),
                note=note3,
            ))
        else:
            total_score += DIM_WEIGHTS["shoulder"] * 0.85

        # --- Hip (optional) ---
        if body.hip_cm and entry.hip_cm:
            w4, note4 = _score_dimension(
                body.hip_cm, entry.hip_cm,
                _ease_for(fit_style, "hip"), DIM_WEIGHTS["hip"]
            )
            total_score += w4
            dim_scores.append(DimensionScore(
                dimension="Hip",
                body_cm=body.hip_cm,
                garment_cm=entry.hip_cm,
                match_pct=round((w4 / DIM_WEIGHTS["hip"]) * 100, 1),
                note=note4,
            ))
        else:
            total_score += DIM_WEIGHTS["hip"] * 0.85

        all_scores[entry.size] = dim_scores

        if total_score > best_score:
            second_score = best_score
            second_size = best_size
            best_score = total_score
            best_size = entry
        elif total_score > second_score:
            second_score = total_score
            second_size = entry

    if not best_size:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="No valid size entries provided.")

    confidence = round(min(99.0, best_score * 100), 1)

    # Fit description
    fit_descriptions = {
        "Oversized": "Intentionally oversized — gives extra room through the body.",
        "Relaxed":   "Comfortable relaxed fit — not too loose, not too fitted.",
        "Regular":   "Classic regular fit — balanced ease throughout.",
        "Slim":      "Slim fit — close to the body with minimal ease.",
        "Tailored":  "Tailored fit — structured and close-fitting.",
    }
    fit_desc = fit_descriptions.get(fit_style, "Regular fit.")

    explanation = _build_explanation(
        body=body,
        recommended=best_size,
        alternative=second_size if second_score > 0.7 else None,
        fit_style=fit_style,
        garment_name=req.garment_name or "",
        confidence=confidence,
    )

    return RecommendResponse(
        recommended_size=best_size.size,
        confidence_pct=confidence,
        fit_description=fit_desc,
        ai_explanation=explanation,
        dimension_scores=all_scores.get(best_size.size, []),
        alternative_size=second_size.size if second_size and second_score > 0.7 else None,
        alternative_note=(
            f"Size {second_size.size} is a close alternative ({second_score * 100:.0f}% match)."
            if second_size and second_score > 0.7 else None
        ),
    )


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("", response_model=RecommendResponse)
def get_recommendation(req: RecommendRequest):
    """
    Given customer body measurements and a garment size chart,
    returns the best size recommendation with confidence score and AI explanation.
    """
    return recommend(req)
