"""
Friend service – friendship-related database operations.
"""

from typing import Optional

from app.config.database import get_pool
from app.utils.logger import logger


async def search_users_by_email(email: str, current_user_id: str) -> list[dict]:
    """Search for users by exact email, excluding the current user."""
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, email, name, avatar_url FROM users WHERE email = $1 AND id != $2",
        email,
        current_user_id,
    )
    return [
        {
            "id": str(r["id"]),
            "email": r["email"],
            "name": r["name"],
            "avatarUrl": r["avatar_url"],
        }
        for r in rows
    ]


async def send_friend_request(requester_id: str, addressee_email: str) -> Optional[dict]:
    """Send a friend request to a user by email. Returns the friendship row or None if user not found."""
    pool = await get_pool()

    # Look up addressee
    addressee = await pool.fetchrow(
        "SELECT id FROM users WHERE email = $1", addressee_email
    )
    if not addressee:
        return None

    addressee_id = str(addressee["id"])
    if addressee_id == requester_id:
        raise ValueError("Cannot send a friend request to yourself")

    # Check for existing friendship in either direction
    existing = await pool.fetchrow(
        """SELECT id, status, requester_id, addressee_id FROM friendships
           WHERE (requester_id = $1 AND addressee_id = $2)
              OR (requester_id = $2 AND addressee_id = $1)""",
        requester_id,
        addressee_id,
    )

    if existing:
        status = existing["status"]
        if status == "accepted":
            raise ValueError("Already friends")
        if status == "pending":
            # If the other person already sent us a request, auto-accept
            if str(existing["requester_id"]) == addressee_id:
                row = await pool.fetchrow(
                    """UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
                       WHERE id = $1 RETURNING id, requester_id, addressee_id, status, created_at""",
                    existing["id"],
                )
                logger.info("Auto-accepted mutual friend request: %s <-> %s", requester_id, addressee_id)
                return _format_friendship(row)
            raise ValueError("Friend request already sent")
        if status == "rejected":
            # Allow re-sending after rejection
            row = await pool.fetchrow(
                """UPDATE friendships SET status = 'pending', requester_id = $1, addressee_id = $2,
                   updated_at = CURRENT_TIMESTAMP
                   WHERE id = $3 RETURNING id, requester_id, addressee_id, status, created_at""",
                requester_id,
                addressee_id,
                existing["id"],
            )
            return _format_friendship(row)

    row = await pool.fetchrow(
        """INSERT INTO friendships (requester_id, addressee_id)
           VALUES ($1, $2)
           RETURNING id, requester_id, addressee_id, status, created_at""",
        requester_id,
        addressee_id,
    )
    logger.info("Friend request sent: %s -> %s", requester_id, addressee_id)
    return _format_friendship(row)


async def get_friend_requests(user_id: str) -> list[dict]:
    """Get pending friend requests addressed to the user."""
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT f.id, f.created_at,
                  u.id AS user_id, u.email, u.name, u.avatar_url
           FROM friendships f
           JOIN users u ON u.id = f.requester_id
           WHERE f.addressee_id = $1 AND f.status = 'pending'
           ORDER BY f.created_at DESC""",
        user_id,
    )
    return [
        {
            "id": str(r["id"]),
            "createdAt": r["created_at"].isoformat(),
            "user": {
                "id": str(r["user_id"]),
                "email": r["email"],
                "name": r["name"],
                "avatarUrl": r["avatar_url"],
            },
        }
        for r in rows
    ]


async def get_sent_requests(user_id: str) -> list[dict]:
    """Get pending friend requests sent by the user."""
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT f.id, f.created_at,
                  u.id AS user_id, u.email, u.name, u.avatar_url
           FROM friendships f
           JOIN users u ON u.id = f.addressee_id
           WHERE f.requester_id = $1 AND f.status = 'pending'
           ORDER BY f.created_at DESC""",
        user_id,
    )
    return [
        {
            "id": str(r["id"]),
            "createdAt": r["created_at"].isoformat(),
            "user": {
                "id": str(r["user_id"]),
                "email": r["email"],
                "name": r["name"],
                "avatarUrl": r["avatar_url"],
            },
        }
        for r in rows
    ]


async def accept_friend_request(friendship_id: str, user_id: str) -> Optional[dict]:
    """Accept a pending friend request. Only the addressee can accept."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
           RETURNING id, requester_id, addressee_id, status, created_at""",
        friendship_id,
        user_id,
    )
    if row:
        logger.info("Friend request accepted: %s", friendship_id)
    return _format_friendship(row) if row else None


async def reject_friend_request(friendship_id: str, user_id: str) -> Optional[dict]:
    """Reject a pending friend request. Only the addressee can reject."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """UPDATE friendships SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
           RETURNING id, requester_id, addressee_id, status, created_at""",
        friendship_id,
        user_id,
    )
    if row:
        logger.info("Friend request rejected: %s", friendship_id)
    return _format_friendship(row) if row else None


async def get_friends(user_id: str) -> list[dict]:
    """Get all accepted friends for a user."""
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT f.id AS friendship_id, f.created_at,
                  u.id AS user_id, u.email, u.name, u.avatar_url
           FROM friendships f
           JOIN users u ON u.id = CASE
               WHEN f.requester_id = $1 THEN f.addressee_id
               ELSE f.requester_id
           END
           WHERE (f.requester_id = $1 OR f.addressee_id = $1)
             AND f.status = 'accepted'
           ORDER BY u.name""",
        user_id,
    )
    return [
        {
            "friendshipId": str(r["friendship_id"]),
            "createdAt": r["created_at"].isoformat(),
            "user": {
                "id": str(r["user_id"]),
                "email": r["email"],
                "name": r["name"],
                "avatarUrl": r["avatar_url"],
            },
        }
        for r in rows
    ]


async def remove_friend(friendship_id: str, user_id: str) -> bool:
    """Remove a friendship. Either party can unfriend."""
    pool = await get_pool()
    result = await pool.execute(
        """DELETE FROM friendships
           WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2)""",
        friendship_id,
        user_id,
    )
    deleted = result == "DELETE 1"
    if deleted:
        logger.info("Friendship removed: %s by user %s", friendship_id, user_id)
    return deleted


def _format_friendship(row) -> dict:
    return {
        "id": str(row["id"]),
        "requesterId": str(row["requester_id"]),
        "addresseeId": str(row["addressee_id"]),
        "status": row["status"],
        "createdAt": row["created_at"].isoformat(),
    }
