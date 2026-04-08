"""
Folder service — CRUD operations for recipe folders.
"""
from __future__ import annotations

from typing import Any

from app.config.database import get_pool
from app.utils.logger import logger


async def get_folders(user_id: str) -> list[dict[str, Any]]:
    """Return all folders for a user with recipe counts, sorted alphabetically."""
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT rf.id, rf.name, rf.created_at,
               COUNT(sr.id) AS recipe_count
        FROM recipe_folders rf
        LEFT JOIN saved_recipes sr ON sr.folder_id = rf.id
        WHERE rf.user_id = $1
        GROUP BY rf.id
        ORDER BY rf.name ASC
        """,
        user_id,
    )
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "recipeCount": int(r["recipe_count"]),
            "createdAt": str(r["created_at"]) if r["created_at"] else None,
        }
        for r in rows
    ]


async def create_folder(user_id: str, name: str) -> dict[str, Any]:
    """Create a new folder. Raises if duplicate name for the user."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO recipe_folders (user_id, name)
        VALUES ($1, $2)
        RETURNING id, name, created_at
        """,
        user_id,
        name.strip(),
    )
    if not row:
        raise RuntimeError("Failed to create folder")
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "recipeCount": 0,
        "createdAt": str(row["created_at"]) if row["created_at"] else None,
    }


async def rename_folder(user_id: str, folder_id: str, name: str) -> dict[str, Any] | None:
    """Rename a folder. Returns updated folder or None if not found."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        UPDATE recipe_folders SET name = $1
        WHERE id = $2 AND user_id = $3
        RETURNING id, name, created_at
        """,
        name.strip(),
        folder_id,
        user_id,
    )
    if not row:
        return None
    count_row = await pool.fetchrow(
        "SELECT COUNT(*) AS cnt FROM saved_recipes WHERE folder_id = $1",
        folder_id,
    )
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "recipeCount": int(count_row["cnt"]) if count_row else 0,
        "createdAt": str(row["created_at"]) if row["created_at"] else None,
    }


async def delete_folder(user_id: str, folder_id: str) -> bool:
    """Delete a folder. Recipes in it become uncategorized (ON DELETE SET NULL). Returns True if deleted."""
    pool = await get_pool()
    result = await pool.execute(
        "DELETE FROM recipe_folders WHERE id = $1 AND user_id = $2",
        folder_id,
        user_id,
    )
    return result == "DELETE 1"


async def move_recipe_to_folder(
    user_id: str, recipe_id: str, folder_id: str | None
) -> bool:
    """Move a recipe to a folder (or to uncategorized if folder_id is None).
    Returns True if the recipe was updated."""
    pool = await get_pool()

    # If a folder_id is given, verify it belongs to the user
    if folder_id is not None:
        folder = await pool.fetchrow(
            "SELECT id FROM recipe_folders WHERE id = $1 AND user_id = $2",
            folder_id,
            user_id,
        )
        if not folder:
            return False

    result = await pool.execute(
        "UPDATE saved_recipes SET folder_id = $1 WHERE id = $2 AND user_id = $3",
        folder_id,
        recipe_id,
        user_id,
    )
    return result == "UPDATE 1"
