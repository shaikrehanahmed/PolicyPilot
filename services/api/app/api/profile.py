import logging
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..schemas.profile import NormalizedProfile

logger = logging.getLogger("policypilot.api.profile")
router = APIRouter(prefix="/profile", tags=["Citizen Profile"])


class ValidateProfileRequest(BaseModel):
    profile: Dict[str, Any] = Field(description="Raw demographic inputs submitted by citizen")


class ValidationResponse(BaseModel):
    valid: bool
    normalized_profile: NormalizedProfile
    warnings: List[str] = Field(default_factory=list)
    fields_recognized: List[str] = Field(default_factory=list)


@router.post("/validate", response_model=ValidationResponse)
async def validate_profile(payload: ValidateProfileRequest) -> ValidationResponse:
    """Validates and deterministically normalizes citizen demographic data.
    Coerces types, handles uppercase state codes, cleans INR income formatting,
    and returns unrecognized attributes in custom_attributes.
    """
    raw = payload.profile
    warnings: List[str] = []
    recognized: List[str] = []

    normalized_data: Dict[str, Any] = {}
    custom_attrs: Dict[str, Any] = {}

    # State validation
    if "state" in raw and raw["state"] is not None:
        state_str = str(raw["state"]).strip().upper()
        if len(state_str) == 2:
            normalized_data["state"] = state_str
            recognized.append("state")
        else:
            warnings.append(f"State code '{raw['state']}' should be a 2-letter standard abbreviation (e.g. TS, DL, MH).")
            normalized_data["state"] = state_str

    # Age validation
    if "age" in raw and raw["age"] is not None:
        try:
            age_int = int(raw["age"])
            if 0 <= age_int <= 125:
                normalized_data["age"] = age_int
                recognized.append("age")
            else:
                warnings.append(f"Age {age_int} is outside realistic human range (0-125).")
        except (ValueError, TypeError):
            warnings.append(f"Age value '{raw['age']}' could not be coerced to integer.")

    # Income validation & coercion
    if "annual_income_inr" in raw and raw["annual_income_inr"] is not None:
        try:
            clean_str = str(raw["annual_income_inr"]).replace(",", "").replace("₹", "").replace("INR", "").strip()
            inc_float = float(clean_str)
            if inc_float >= 0:
                normalized_data["annual_income_inr"] = inc_float
                recognized.append("annual_income_inr")
            else:
                warnings.append("Annual income cannot be negative.")
        except (ValueError, TypeError):
            warnings.append(f"Income '{raw['annual_income_inr']}' could not be coerced to currency number.")

    # Occupation
    if "occupation" in raw and raw["occupation"] is not None:
        normalized_data["occupation"] = str(raw["occupation"]).strip().lower()
        recognized.append("occupation")

    # Category
    if "category" in raw and raw["category"] is not None:
        cat_str = str(raw["category"]).strip().upper()
        if cat_str in ["GEN", "OBC", "SC", "ST", "EWS"]:
            normalized_data["category"] = cat_str
            recognized.append("category")
        else:
            normalized_data["category"] = cat_str
            recognized.append("category")
            warnings.append(f"Category '{cat_str}' is non-standard. Expected one of GEN, OBC, SC, ST, EWS.")

    # Gender
    if "gender" in raw and raw["gender"] is not None:
        normalized_data["gender"] = str(raw["gender"]).strip().lower()
        recognized.append("gender")

    # Landholding
    if "landholding_acres" in raw and raw["landholding_acres"] is not None:
        try:
            land_float = float(str(raw["landholding_acres"]).replace(",", "").strip())
            if land_float >= 0:
                normalized_data["landholding_acres"] = land_float
                recognized.append("landholding_acres")
            else:
                warnings.append("Landholding acres cannot be negative.")
        except (ValueError, TypeError):
            warnings.append(f"Landholding '{raw['landholding_acres']}' could not be parsed as acres.")

    # Disability
    if "disability_percent" in raw and raw["disability_percent"] is not None:
        try:
            dis_float = float(raw["disability_percent"])
            if 0 <= dis_float <= 100:
                normalized_data["disability_percent"] = dis_float
                recognized.append("disability_percent")
            else:
                warnings.append("Disability percent must be between 0 and 100.")
        except (ValueError, TypeError):
            warnings.append("Disability percent could not be coerced to number.")

    # Education level
    if "education_level" in raw and raw["education_level"] is not None:
        normalized_data["education_level"] = str(raw["education_level"]).strip()
        recognized.append("education_level")

    # Minority
    if "is_minority" in raw and raw["is_minority"] is not None:
        normalized_data["is_minority"] = bool(raw["is_minority"])
        recognized.append("is_minority")

    # Goal
    if "goal" in raw and raw["goal"] is not None:
        normalized_data["goal"] = str(raw["goal"]).strip()
        recognized.append("goal")

    # Collect any extra attributes into custom_attributes
    for k, v in raw.items():
        if k not in normalized_data and k not in ["custom_attributes"]:
            custom_attrs[k] = v

    normalized_data["custom_attributes"] = custom_attrs
    profile_model = NormalizedProfile(**normalized_data)

    return ValidationResponse(
        valid=True,
        normalized_profile=profile_model,
        warnings=warnings,
        fields_recognized=recognized,
    )
