"""
Saved-recipe routes.

Provides endpoints for managing a user's saved recipes:
  GET  /recipes       – list the authenticated user's saved recipes
  GET  /recipes/{id}  – get a single saved recipe by ID
  POST /recipes       – save a new recipe
"""

import json
from typing import Any, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.middleware.auth import CurrentUser, get_current_user
from app.services import recipe_service as svc
from app.utils.logger import logger

router = APIRouter(prefix="/recipes", tags=["recipes"])


class StepPayload(BaseModel):
    instruction: str
    ingredients: list[str] = []


class SaveRecipePayload(BaseModel):
    title: str
    description: Optional[str] = None
    sourceUrl: Optional[str] = None
    prepTime: Optional[str] = None
    cookTime: Optional[str] = None
    coolTime: Optional[str] = None
    chillTime: Optional[str] = None
    restTime: Optional[str] = None
    marinateTime: Optional[str] = None
    soakTime: Optional[str] = None
    totalTime: Optional[str] = None
    servings: Optional[str] = None
    ingredients: list[str] = []
    steps: list[Any] = []
    notes: list[str] = []


@router.get("")
async def list_recipes(user: CurrentUser = Depends(get_current_user)):
    """Return all saved recipes for the authenticated user, newest first."""
    rows = await svc.get_saved_recipes(user.id)
    return {"recipes": rows}


@router.get("/count")
async def recipe_count(user: CurrentUser = Depends(get_current_user)):
    """Return the number of saved recipes for the authenticated user."""
    count = await svc.count_saved_recipes(user.id)
    return {"count": count}


@router.get("/{recipe_id}")
async def get_recipe(
    recipe_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Return a single saved recipe with full details."""
    recipe = await svc.get_saved_recipe_by_id(user.id, recipe_id)
    if not recipe:
        return JSONResponse(status_code=404, content={"error": "Recipe not found"})
    return {"recipe": recipe}


@router.post("")
async def save_recipe(
    payload: SaveRecipePayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Save a new recipe for the authenticated user."""
    try:
        row = await svc.create_saved_recipe(
            user_id=user.id,
            title=payload.title,
            description=payload.description,
            source_url=payload.sourceUrl,
            prep_time=payload.prepTime,
            cook_time=payload.cookTime,
            cool_time=payload.coolTime,
            chill_time=payload.chillTime,
            rest_time=payload.restTime,
            marinate_time=payload.marinateTime,
            soak_time=payload.soakTime,
            total_time=payload.totalTime,
            servings=payload.servings,
            ingredients=payload.ingredients,
            steps=payload.steps,
            notes=payload.notes,
        )
        return {"recipe": row}
    except Exception:
        logger.error("Failed to save recipe", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal Server Error", "message": "Failed to save recipe"},
        )
