"""
Group routes.

Provides endpoints for managing groups and their members:
  POST   /groups                         – create a new group
  GET    /groups                         – list user's groups
  GET    /groups/{id}                    – get group details
  PUT    /groups/{id}                    – update group name (admin only)
  DELETE /groups/{id}                    – delete a group (admin only)
  GET    /groups/{id}/members            – list group members
  POST   /groups/{id}/members            – add a friend to the group (admin only)
  DELETE /groups/{id}/members/{user_id}  – remove a member (admin or self)

Recipe sharing within groups:
  POST   /groups/{id}/recipes                  – share a recipe to the group
  GET    /groups/{id}/recipes                  – list shared recipes
  GET    /groups/{id}/recipes/{recipe_id}      – get shared recipe detail
  POST   /groups/{id}/recipes/{recipe_id}/save – save a copy of a shared recipe
  DELETE /groups/{id}/recipes/{share_id}       – unshare a recipe
"""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.middleware.auth import CurrentUser, get_current_user
from app.services import group_service as group_svc
from app.services import sharing_service as share_svc
from app.services.subscription_service import FREE_RECIPE_LIMIT, is_pro
from app.services.recipe_service import count_saved_recipes
from app.utils.logger import logger

router = APIRouter(prefix="/groups", tags=["groups"])


class CreateGroupPayload(BaseModel):
    name: str


class UpdateGroupPayload(BaseModel):
    name: str


class AddMemberPayload(BaseModel):
    userId: str


class ShareRecipePayload(BaseModel):
    recipeId: str


# ── Group CRUD ───────────────────────────────────────────────────────


@router.post("")
async def create_group(
    payload: CreateGroupPayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Create a new group."""
    group = await group_svc.create_group(payload.name.strip(), user.id)
    return {"group": group}


@router.get("")
async def list_groups(user: CurrentUser = Depends(get_current_user)):
    """List all groups the user belongs to."""
    groups = await group_svc.get_user_groups(user.id)
    return {"groups": groups}


@router.get("/{group_id}")
async def get_group(
    group_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Get a group's details."""
    group = await group_svc.get_group(group_id, user.id)
    if not group:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "Group not found"}},
        )
    return {"group": group}


@router.put("/{group_id}")
async def update_group(
    group_id: str,
    payload: UpdateGroupPayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Update a group's name. Admin only."""
    group = await group_svc.update_group(group_id, payload.name.strip(), user.id)
    if not group:
        return JSONResponse(
            status_code=403,
            content={"error": {"message": "Not authorized to update this group"}},
        )
    return {"group": group}


@router.delete("/{group_id}")
async def delete_group(
    group_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Delete a group. Admin only."""
    deleted = await group_svc.delete_group(group_id, user.id)
    if not deleted:
        return JSONResponse(
            status_code=403,
            content={"error": {"message": "Not authorized to delete this group"}},
        )
    return {"message": "Group deleted"}


# ── Members ──────────────────────────────────────────────────────────


@router.get("/{group_id}/members")
async def list_members(
    group_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """List members of a group."""
    members = await group_svc.get_members(group_id, user.id)
    if members is None:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "Group not found"}},
        )
    return {"members": members}


@router.post("/{group_id}/members")
async def add_member(
    group_id: str,
    payload: AddMemberPayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Add a friend to the group. Admin only."""
    error = await group_svc.add_member(group_id, payload.userId, user.id)

    if error == "not_admin":
        return JSONResponse(
            status_code=403,
            content={"error": {"message": "Only group admins can add members"}},
        )
    if error == "not_friends":
        return JSONResponse(
            status_code=400,
            content={"error": {"message": "You can only add friends to a group"}},
        )
    if error == "already_member":
        return JSONResponse(
            status_code=409,
            content={"error": {"message": "User is already a member of this group"}},
        )
    return {"message": "Member added"}


@router.delete("/{group_id}/members/{target_user_id}")
async def remove_member(
    group_id: str,
    target_user_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Remove a member from the group. Admin can remove anyone; members can leave."""
    error = await group_svc.remove_member(group_id, target_user_id, user.id)

    if error == "not_member":
        return JSONResponse(status_code=404, content={"error": {"message": "Not a group member"}})
    if error == "not_admin":
        return JSONResponse(status_code=403, content={"error": {"message": "Only admins can remove other members"}})
    if error == "last_admin":
        return JSONResponse(status_code=400, content={"error": {"message": "Cannot remove the last admin. Delete the group instead."}})
    if error == "not_found":
        return JSONResponse(status_code=404, content={"error": {"message": "Member not found"}})
    return {"message": "Member removed"}


# ── Shared Recipes ───────────────────────────────────────────────────


@router.post("/{group_id}/recipes")
async def share_recipe(
    group_id: str,
    payload: ShareRecipePayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Share a saved recipe to a group."""
    error = await share_svc.share_recipe(group_id, payload.recipeId, user.id)

    if error == "not_member":
        return JSONResponse(status_code=403, content={"error": {"message": "You are not a member of this group"}})
    if error == "not_owner":
        return JSONResponse(status_code=403, content={"error": {"message": "You can only share your own recipes"}})
    if error == "already_shared":
        return JSONResponse(status_code=409, content={"error": {"message": "Recipe is already shared in this group"}})
    return {"message": "Recipe shared"}


@router.get("/{group_id}/recipes")
async def list_group_recipes(
    group_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """List all recipes shared in a group."""
    recipes = await share_svc.get_group_recipes(group_id, user.id)
    if recipes is None:
        return JSONResponse(status_code=404, content={"error": {"message": "Group not found"}})
    return {"recipes": recipes}


@router.get("/{group_id}/recipes/{recipe_id}")
async def get_shared_recipe(
    group_id: str,
    recipe_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Get the full details of a shared recipe."""
    recipe = await share_svc.get_shared_recipe_detail(group_id, recipe_id, user.id)
    if not recipe:
        return JSONResponse(status_code=404, content={"error": {"message": "Shared recipe not found"}})
    return {"recipe": recipe}


@router.post("/{group_id}/recipes/{recipe_id}/save")
async def save_shared_recipe(
    group_id: str,
    recipe_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Save a copy of a shared recipe to your own collection."""
    # Check free tier limit
    if not await is_pro(user.id):
        count = await count_saved_recipes(user.id)
        if count >= FREE_RECIPE_LIMIT:
            return JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "message": f"Free accounts can save up to {FREE_RECIPE_LIMIT} recipes. Upgrade to Pro for unlimited saves.",
                        "code": "RECIPE_LIMIT_REACHED",
                    }
                },
            )

    recipe = await share_svc.save_shared_recipe(group_id, recipe_id, user.id)
    if not recipe:
        return JSONResponse(status_code=404, content={"error": {"message": "Shared recipe not found"}})
    return {"recipe": recipe}


@router.delete("/{group_id}/recipes/{share_id}/unshare")
async def unshare_recipe(
    group_id: str,
    share_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Remove a shared recipe from the group."""
    error = await share_svc.unshare_recipe(share_id, group_id, user.id)

    if error == "not_found":
        return JSONResponse(status_code=404, content={"error": {"message": "Shared recipe not found"}})
    if error == "not_authorized":
        return JSONResponse(status_code=403, content={"error": {"message": "Not authorized to unshare this recipe"}})
    return {"message": "Recipe unshared"}
