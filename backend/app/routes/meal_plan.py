"""
Meal-plan routes.

Provides the AI meal-plan generation endpoint:
  POST /meal-plan/generate — generate a meal plan from saved recipes
"""

from typing import Optional

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.middleware.auth import CurrentUser, get_current_user
from app.services.entitlement_service import is_entitled
from app.services.meal_plan_service import (
    MAX_DAYS,
    MAX_SELECTED_RECIPES,
    generate_meal_plan,
)
from app.utils.logger import logger

router = APIRouter(prefix="/meal-plan", tags=["meal-plan"])
limiter = Limiter(key_func=get_remote_address)

ALLOWED_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}


# ── request model ────────────────────────────────────────────────────


class GenerateMealPlanPayload(BaseModel):
    selectedRecipeIds: list[str] = []
    days: int = 7
    mealsPerDay: list[str] = ["breakfast", "lunch", "dinner"]

    @field_validator("days")
    @classmethod
    def validate_days(cls, v: int) -> int:
        if v < 1 or v > MAX_DAYS:
            raise ValueError(f"days must be between 1 and {MAX_DAYS}")
        return v

    @field_validator("selectedRecipeIds")
    @classmethod
    def validate_recipe_ids(cls, v: list[str]) -> list[str]:
        # Deduplicate preserving order
        seen: set[str] = set()
        deduped: list[str] = []
        for rid in v:
            if rid not in seen:
                seen.add(rid)
                deduped.append(rid)
        if len(deduped) > MAX_SELECTED_RECIPES:
            raise ValueError(f"Maximum {MAX_SELECTED_RECIPES} recipes can be selected")
        return deduped

    @field_validator("mealsPerDay")
    @classmethod
    def validate_meals(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one meal type is required")
        invalid = [m for m in v if m not in ALLOWED_MEAL_TYPES]
        if invalid:
            raise ValueError(f"Invalid meal types: {invalid}. Allowed: {sorted(ALLOWED_MEAL_TYPES)}")
        return v


# ── POST /meal-plan/generate ─────────────────────────────────────────


@router.post("/generate")
@limiter.limit("5/minute")
async def generate(
    payload: GenerateMealPlanPayload,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
):
    """Generate an AI meal plan. Requires Pro entitlement."""

    if not await is_entitled(user.id, "pro"):
        return JSONResponse(
            status_code=403,
            content={
                "error": {
                    "message": "Meal planning requires a Pro subscription. Upgrade to unlock this feature.",
                    "code": "PRO_REQUIRED",
                }
            },
        )

    logger.info(
        "meal-plan/generate – user=%s, days=%d, meals=%s, recipes=%d",
        user.id, payload.days, payload.mealsPerDay, len(payload.selectedRecipeIds),
    )

    result = await generate_meal_plan(
        user_id=str(user.id),
        selected_recipe_ids=payload.selectedRecipeIds,
        days=payload.days,
        meals_per_day=payload.mealsPerDay,
    )

    if not result.get("success", False):
        error_msg = result.get("error", "Meal plan generation failed")
        status = result.get("status_code", 500)
        return JSONResponse(
            status_code=status if isinstance(status, int) and status >= 400 else 500,
            content={"error": {"message": error_msg, "code": "GENERATION_FAILED"}},
        )

    return result
