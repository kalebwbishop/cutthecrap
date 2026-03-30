"""
Auth service – user-related database operations.
"""

from typing import Optional

from app.config.database import get_pool
from app.utils.logger import logger


async def find_user_by_workos_id(workos_user_id: str) -> Optional[dict]:
    """Return a user row by WorkOS user ID, or None."""
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT * FROM users WHERE workos_user_id = $1",
        workos_user_id,
    )
    return dict(row) if row else None


async def create_user(
    *,
    workos_user_id: str,
    email: str,
    name: str,
    avatar_url: Optional[str] = None,
) -> dict:
    """Insert a new user and return the row."""
    pool = await get_pool()
    row = await pool.fetchrow(
        "INSERT INTO users (workos_user_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *",
        workos_user_id,
        email,
        name,
        avatar_url,
    )
    if not row:
        raise RuntimeError("Failed to create user")
    logger.info("New user created: %s", email)
    return dict(row)


async def get_user_with_profile(workos_user_id: str) -> Optional[dict]:
    """Return the user by their WorkOS ID, or None."""
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT * FROM users WHERE workos_user_id = $1",
        workos_user_id,
    )
    if row is None:
        return None
    d = dict(row)
    d["id"] = str(d["id"])
    return d


async def delete_user(user_id: str) -> bool:
    """Delete a user and all associated data (cascades to saved_recipes and recipe_history)."""
    pool = await get_pool()
    result = await pool.execute("DELETE FROM users WHERE id = $1", user_id)
    deleted = result == "DELETE 1"
    if deleted:
        logger.info("User deleted: %s", user_id)
    return deleted
