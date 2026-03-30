"""
Group service – group and membership database operations.
"""

from typing import Optional

from app.config.database import get_pool
from app.utils.logger import logger


async def create_group(name: str, created_by: str) -> dict:
    """Create a new group and add the creator as admin."""
    pool = await get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """INSERT INTO groups (name, created_by)
                   VALUES ($1, $2)
                   RETURNING id, name, created_by, created_at""",
                name,
                created_by,
            )
            await conn.execute(
                """INSERT INTO group_members (group_id, user_id, role)
                   VALUES ($1, $2, 'admin')""",
                row["id"],
                created_by,
            )

    logger.info("Group created: %s by user %s", row["id"], created_by)
    return _format_group(row)


async def get_user_groups(user_id: str) -> list[dict]:
    """Get all groups the user is a member of."""
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT g.id, g.name, g.created_by, g.created_at,
                  gm.role,
                  (SELECT count(*) FROM group_members WHERE group_id = g.id) AS member_count,
                  (SELECT count(*) FROM group_shared_recipes WHERE group_id = g.id) AS recipe_count
           FROM groups g
           JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
           ORDER BY g.name""",
        user_id,
    )
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "createdBy": str(r["created_by"]),
            "createdAt": r["created_at"].isoformat(),
            "role": r["role"],
            "memberCount": r["member_count"],
            "recipeCount": r["recipe_count"],
        }
        for r in rows
    ]


async def get_group(group_id: str, user_id: str) -> Optional[dict]:
    """Get a single group by ID. Returns None if user is not a member."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """SELECT g.id, g.name, g.created_by, g.created_at,
                  gm.role
           FROM groups g
           JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $2
           WHERE g.id = $1""",
        group_id,
        user_id,
    )
    if not row:
        return None
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "createdBy": str(row["created_by"]),
        "createdAt": row["created_at"].isoformat(),
        "role": row["role"],
    }


async def update_group(group_id: str, name: str, user_id: str) -> Optional[dict]:
    """Update a group name. Only admins can update."""
    pool = await get_pool()

    # Check admin role
    member = await pool.fetchrow(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        user_id,
    )
    if not member or member["role"] != "admin":
        return None

    row = await pool.fetchrow(
        """UPDATE groups SET name = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING id, name, created_by, created_at""",
        name,
        group_id,
    )
    if row:
        logger.info("Group updated: %s", group_id)
    return _format_group(row) if row else None


async def delete_group(group_id: str, user_id: str) -> bool:
    """Delete a group. Only admins can delete."""
    pool = await get_pool()

    member = await pool.fetchrow(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        user_id,
    )
    if not member or member["role"] != "admin":
        return False

    result = await pool.execute("DELETE FROM groups WHERE id = $1", group_id)
    deleted = result == "DELETE 1"
    if deleted:
        logger.info("Group deleted: %s by user %s", group_id, user_id)
    return deleted


async def get_members(group_id: str, user_id: str) -> Optional[list[dict]]:
    """Get all members of a group. Returns None if requesting user is not a member."""
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
        """SELECT u.id, u.email, u.name, u.avatar_url, gm.role, gm.joined_at
           FROM group_members gm
           JOIN users u ON u.id = gm.user_id
           WHERE gm.group_id = $1
           ORDER BY gm.role DESC, u.name""",
        group_id,
    )
    return [
        {
            "id": str(r["id"]),
            "email": r["email"],
            "name": r["name"],
            "avatarUrl": r["avatar_url"],
            "role": r["role"],
            "joinedAt": r["joined_at"].isoformat(),
        }
        for r in rows
    ]


async def add_member(group_id: str, target_user_id: str, current_user_id: str) -> Optional[str]:
    """Add a friend to a group. Only admins can add members.
    Returns None on success, or an error message string."""
    pool = await get_pool()

    # Check admin role
    member = await pool.fetchrow(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        current_user_id,
    )
    if not member or member["role"] != "admin":
        return "not_admin"

    # Verify the target is a friend of the current user
    friendship = await pool.fetchrow(
        """SELECT 1 FROM friendships
           WHERE ((requester_id = $1 AND addressee_id = $2)
              OR (requester_id = $2 AND addressee_id = $1))
             AND status = 'accepted'""",
        current_user_id,
        target_user_id,
    )
    if not friendship:
        return "not_friends"

    # Check if already a member
    existing = await pool.fetchrow(
        "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        target_user_id,
    )
    if existing:
        return "already_member"

    await pool.execute(
        "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
        group_id,
        target_user_id,
    )
    logger.info("Member %s added to group %s by %s", target_user_id, group_id, current_user_id)
    return None


async def remove_member(group_id: str, target_user_id: str, current_user_id: str) -> Optional[str]:
    """Remove a member from a group. Admins can remove anyone; members can only remove themselves.
    Returns None on success, or an error message string."""
    pool = await get_pool()

    # Get current user's role
    current_member = await pool.fetchrow(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        current_user_id,
    )
    if not current_member:
        return "not_member"

    # Non-admins can only remove themselves
    if current_member["role"] != "admin" and target_user_id != current_user_id:
        return "not_admin"

    # Prevent removing the last admin
    if target_user_id == current_user_id and current_member["role"] == "admin":
        admin_count = await pool.fetchval(
            "SELECT count(*) FROM group_members WHERE group_id = $1 AND role = 'admin'",
            group_id,
        )
        if admin_count <= 1:
            return "last_admin"

    result = await pool.execute(
        "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2",
        group_id,
        target_user_id,
    )
    if result != "DELETE 1":
        return "not_found"

    logger.info("Member %s removed from group %s by %s", target_user_id, group_id, current_user_id)
    return None


def _format_group(row) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "createdBy": str(row["created_by"]),
        "createdAt": row["created_at"].isoformat(),
    }
