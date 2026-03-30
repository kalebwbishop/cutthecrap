"""
Recipe-folder routes.

Provides endpoints for managing a user's recipe folders:
  GET    /folders           – list folders with recipe counts
  POST   /folders           – create a new folder
  PUT    /folders/{id}      – rename a folder
  DELETE /folders/{id}      – delete a folder (recipes become uncategorized)
  PATCH  /folders/move      – move a recipe into/out of a folder
"""

from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.middleware.auth import CurrentUser, get_current_user
from app.services import folder_service as svc
from app.utils.logger import logger

router = APIRouter(prefix="/folders", tags=["folders"])


class CreateFolderPayload(BaseModel):
    name: str


class RenameFolderPayload(BaseModel):
    name: str


class MoveRecipePayload(BaseModel):
    recipeId: str
    folderId: Optional[str] = None


@router.get("")
async def list_folders(user: CurrentUser = Depends(get_current_user)):
    """Return all folders for the authenticated user with recipe counts."""
    folders = await svc.get_folders(user.id)
    return {"folders": folders}


@router.post("")
async def create_folder(
    payload: CreateFolderPayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Create a new recipe folder."""
    if not payload.name or not payload.name.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "Folder name is required"},
        )
    try:
        folder = await svc.create_folder(user.id, payload.name)
        return {"folder": folder}
    except Exception as e:
        if "unique_user_folder_name" in str(e):
            return JSONResponse(
                status_code=409,
                content={"error": "A folder with that name already exists"},
            )
        logger.error("Failed to create folder", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to create folder"},
        )


@router.put("/{folder_id}")
async def rename_folder(
    folder_id: str,
    payload: RenameFolderPayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Rename a recipe folder."""
    if not payload.name or not payload.name.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "Folder name is required"},
        )
    try:
        folder = await svc.rename_folder(user.id, folder_id, payload.name)
        if not folder:
            return JSONResponse(status_code=404, content={"error": "Folder not found"})
        return {"folder": folder}
    except Exception as e:
        if "unique_user_folder_name" in str(e):
            return JSONResponse(
                status_code=409,
                content={"error": "A folder with that name already exists"},
            )
        logger.error("Failed to rename folder", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to rename folder"},
        )


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Delete a recipe folder. Recipes in it become uncategorized."""
    deleted = await svc.delete_folder(user.id, folder_id)
    if not deleted:
        return JSONResponse(status_code=404, content={"error": "Folder not found"})
    return {"success": True}


@router.patch("/move")
async def move_recipe(
    payload: MoveRecipePayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Move a recipe into a folder, or to uncategorized (folderId=null)."""
    moved = await svc.move_recipe_to_folder(user.id, payload.recipeId, payload.folderId)
    if not moved:
        return JSONResponse(
            status_code=404,
            content={"error": "Recipe or folder not found"},
        )
    return {"success": True}
