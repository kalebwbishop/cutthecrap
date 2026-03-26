"""
Sharing service – recipe sharing within groups.
"""

import json
from typing import Optional

from app.config.database import get_pool
from app.utils.logger import logger


async def share_recipe(group_id: str, recipe_id: str, user_id: str) -> Optional[str]:
    """Share a saved recipe to a group. User must be a member and own the recipe.
    Returns None on success, or an error message string."""
    pool = await get_pool()

    # Verify group membership
    is_member = await pool.fetchrow(
        "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        user_id,
    )
    if not is_member:
        return "not_member"

    # Verify recipe ownership
    owns_recipe = await pool.fetchrow(
        "SELECT 1 FROM saved_recipes WHERE id = $1 AND user_id = $2",
        recipe_id,
        user_id,
    )
    if not owns_recipe:
        return "not_owner"

    # Check if already shared
    existing = await pool.fetchrow(
        "SELECT 1 FROM group_shared_recipes WHERE group_id = $1 AND recipe_id = $2",
        group_id,
        recipe_id,
    )
    if existing:
        return "already_shared"

    await pool.execute(
        """INSERT INTO group_shared_recipes (group_id, shared_by, recipe_id)
           VALUES ($1, $2, $3)""",
        group_id,
        user_id,
        recipe_id,
    )
    logger.info("Recipe %s shared to group %s by %s", recipe_id, group_id, user_id)
    return None


async def get_group_recipes(group_id: str, user_id: str) -> Optional[list[dict]]:
    """Get all recipes shared in a group. Returns None if user is not a member."""
    pool = await get_pool()

    # Verify membership
    is_member = await pool.fetchrow(
        "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        user_id,
    )
    if not is_member:
        return None

    rows = await pool.fetch(
        """SELECT gsr.id AS share_id, gsr.shared_at,
                  sr.id AS recipe_id, sr.title, sr.description, sr.source_url,
                  u.id AS sharer_id, u.name AS sharer_name, u.avatar_url AS sharer_avatar
           FROM group_shared_recipes gsr
           JOIN saved_recipes sr ON sr.id = gsr.recipe_id
           JOIN users u ON u.id = gsr.shared_by
           WHERE gsr.group_id = $1
           ORDER BY gsr.shared_at DESC""",
        group_id,
    )
    return [
        {
            "shareId": str(r["share_id"]),
            "sharedAt": r["shared_at"].isoformat(),
            "recipe": {
                "id": str(r["recipe_id"]),
                "title": r["title"],
                "description": r["description"],
                "sourceUrl": r["source_url"],
            },
            "sharedBy": {
                "id": str(r["sharer_id"]),
                "name": r["sharer_name"],
                "avatarUrl": r["sharer_avatar"],
            },
        }
        for r in rows
    ]


async def get_shared_recipe_detail(group_id: str, recipe_id: str, user_id: str) -> Optional[dict]:
    """Get full details of a shared recipe. User must be a group member."""
    pool = await get_pool()

    # Verify membership
    is_member = await pool.fetchrow(
        "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        user_id,
    )
    if not is_member:
        return None

    row = await pool.fetchrow(
        """SELECT sr.*, u.name AS sharer_name, u.avatar_url AS sharer_avatar,
                  gsr.shared_at
           FROM group_shared_recipes gsr
           JOIN saved_recipes sr ON sr.id = gsr.recipe_id
           JOIN users u ON u.id = gsr.shared_by
           WHERE gsr.group_id = $1 AND gsr.recipe_id = $2""",
        group_id,
        recipe_id,
    )
    if not row:
        return None

    steps = row["steps"]
    if isinstance(steps, str):
        steps = json.loads(steps)

    return {
        "id": str(row["id"]),
        "title": row["title"],
        "description": row["description"],
        "sourceUrl": row["source_url"],
        "prepTime": row["prep_time"],
        "cookTime": row["cook_time"],
        "coolTime": row["cool_time"],
        "chillTime": row["chill_time"],
        "restTime": row["rest_time"],
        "marinateTime": row["marinate_time"],
        "soakTime": row["soak_time"],
        "totalTime": row["total_time"],
        "servings": row["servings"],
        "ingredients": list(row["ingredients"]),
        "steps": steps,
        "notes": list(row["notes"]),
        "sharedAt": row["shared_at"].isoformat(),
        "sharedBy": {
            "name": row["sharer_name"],
            "avatarUrl": row["sharer_avatar"],
        },
    }


async def unshare_recipe(share_id: str, group_id: str, user_id: str) -> Optional[str]:
    """Remove a shared recipe from a group. The sharer or a group admin can unshare.
    Returns None on success, or an error message string."""
    pool = await get_pool()

    # Get share info
    share = await pool.fetchrow(
        "SELECT shared_by FROM group_shared_recipes WHERE id = $1 AND group_id = $2",
        share_id,
        group_id,
    )
    if not share:
        return "not_found"

    # Check if user is the sharer or an admin
    is_sharer = str(share["shared_by"]) == user_id
    if not is_sharer:
        member = await pool.fetchrow(
            "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
            group_id,
            user_id,
        )
        if not member or member["role"] != "admin":
            return "not_authorized"

    await pool.execute("DELETE FROM group_shared_recipes WHERE id = $1", share_id)
    logger.info("Recipe unshared: share %s from group %s by %s", share_id, group_id, user_id)
    return None


async def save_shared_recipe(group_id: str, recipe_id: str, user_id: str) -> Optional[dict]:
    """Save a copy of a shared recipe to the user's own collection.
    Returns the new recipe row, or None if not a member or recipe not found."""
    pool = await get_pool()

    # Verify membership
    is_member = await pool.fetchrow(
        "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        user_id,
    )
    if not is_member:
        return None

    # Get the shared recipe data
    row = await pool.fetchrow(
        """SELECT sr.*
           FROM group_shared_recipes gsr
           JOIN saved_recipes sr ON sr.id = gsr.recipe_id
           WHERE gsr.group_id = $1 AND gsr.recipe_id = $2""",
        group_id,
        recipe_id,
    )
    if not row:
        return None

    steps = row["steps"]
    if isinstance(steps, str):
        steps = json.loads(steps)
    steps_json = json.dumps(steps)

    # Create a copy for the user
    new_row = await pool.fetchrow(
        """INSERT INTO saved_recipes
           (user_id, title, description, source_url,
            prep_time, cook_time, cool_time, chill_time,
            rest_time, marinate_time, soak_time, total_time,
            servings, ingredients, steps, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16)
           RETURNING id, title, source_url, created_at""",
        user_id,
        row["title"],
        row["description"],
        row["source_url"],
        row["prep_time"],
        row["cook_time"],
        row["cool_time"],
        row["chill_time"],
        row["rest_time"],
        row["marinate_time"],
        row["soak_time"],
        row["total_time"],
        row["servings"],
        list(row["ingredients"]),
        steps_json,
        list(row["notes"]),
    )

    logger.info("User %s saved shared recipe %s from group %s", user_id, recipe_id, group_id)
    return {
        "id": str(new_row["id"]),
        "title": new_row["title"],
        "sourceUrl": new_row["source_url"],
        "createdAt": new_row["created_at"].isoformat(),
    }
