"""
Friend routes.

Provides endpoints for managing friendships:
  GET    /friends              – list accepted friends
  GET    /friends/requests     – list pending incoming requests
  GET    /friends/sent         – list pending outgoing requests
  GET    /friends/search       – search users by email
  POST   /friends/request      – send a friend request
  POST   /friends/accept/{id}  – accept a friend request
  POST   /friends/reject/{id}  – reject a friend request
  DELETE /friends/{id}         – remove a friendship
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.middleware.auth import CurrentUser, get_current_user
from app.services import friend_service as svc
from app.utils.logger import logger

router = APIRouter(prefix="/friends", tags=["friends"])


class FriendRequestPayload(BaseModel):
    email: str


@router.get("")
async def list_friends(user: CurrentUser = Depends(get_current_user)):
    """Return all accepted friends for the authenticated user."""
    friends = await svc.get_friends(user.id)
    return {"friends": friends}


@router.get("/requests")
async def list_requests(user: CurrentUser = Depends(get_current_user)):
    """Return pending incoming friend requests."""
    requests = await svc.get_friend_requests(user.id)
    return {"requests": requests}


@router.get("/sent")
async def list_sent(user: CurrentUser = Depends(get_current_user)):
    """Return pending outgoing friend requests."""
    sent = await svc.get_sent_requests(user.id)
    return {"requests": sent}


@router.get("/search")
async def search_users(
    email: str = Query(..., description="Email to search for"),
    user: CurrentUser = Depends(get_current_user),
):
    """Search for users by exact email address."""
    results = await svc.search_users_by_email(email.strip().lower(), user.id)
    return {"users": results}


@router.post("/request")
async def send_request(
    payload: FriendRequestPayload,
    user: CurrentUser = Depends(get_current_user),
):
    """Send a friend request to a user by email."""
    try:
        result = await svc.send_friend_request(user.id, payload.email.strip().lower())
        if result is None:
            return JSONResponse(
                status_code=404,
                content={"error": {"message": "User not found with that email"}},
            )
        return {"friendship": result}
    except ValueError as e:
        return JSONResponse(
            status_code=409,
            content={"error": {"message": str(e)}},
        )
    except Exception:
        logger.error("Failed to send friend request", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": {"message": "Failed to send friend request"}},
        )


@router.post("/accept/{friendship_id}")
async def accept_request(
    friendship_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Accept a pending friend request."""
    result = await svc.accept_friend_request(friendship_id, user.id)
    if not result:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "Friend request not found or already handled"}},
        )
    return {"friendship": result}


@router.post("/reject/{friendship_id}")
async def reject_request(
    friendship_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Reject a pending friend request."""
    result = await svc.reject_friend_request(friendship_id, user.id)
    if not result:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "Friend request not found or already handled"}},
        )
    return {"friendship": result}


@router.delete("/{friendship_id}")
async def remove_friend(
    friendship_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Remove a friendship."""
    deleted = await svc.remove_friend(friendship_id, user.id)
    if not deleted:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "Friendship not found"}},
        )
    return {"message": "Friend removed"}
