"""
ChatGPT / recipe-extraction routes.

Provides two endpoints consumed by the frontend:
  POST /chatgpt/parse      – parse raw text via OpenAI
  POST /chatgpt/parse-url  – fetch a URL, extract text, then parse via OpenAI
"""

from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.recipe_service import (
    RECIPE_RESPONSE_FORMAT,
    RECIPE_SYSTEM_PROMPT,
    call_openai_chat,
    fetch_and_extract,
)
from app.utils.logger import logger

router = APIRouter(prefix="/chatgpt", tags=["chatgpt"])


# ── request models ───────────────────────────────────────────────────


class ParseTextPayload(BaseModel):
    text: str
    system_prompt: Optional[str] = None
    model: str = "gpt-4o-mini"
    response_format: Optional[dict[str, Any]] = None
    temperature: float = 0.2
    max_tokens: int = 2000


class ParseUrlPayload(BaseModel):
    url: str
    system_prompt: Optional[str] = None
    model: str = "gpt-4o-mini"
    response_format: Optional[dict[str, Any]] = None
    temperature: float = 0.2
    max_tokens: int = 2000


# ── POST /chatgpt/parse ─────────────────────────────────────────────


@router.post("/parse")
async def parse_text(payload: ParseTextPayload):
    """Send raw text to OpenAI and return the structured result."""
    logger.info("chatgpt/parse – model=%s, text length=%d", payload.model, len(payload.text))

    result = await call_openai_chat(
        text=payload.text,
        system_prompt=payload.system_prompt or RECIPE_SYSTEM_PROMPT,
        model=payload.model,
        response_format=payload.response_format or RECIPE_RESPONSE_FORMAT,
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
    )

    return result


# ── POST /chatgpt/parse-url ─────────────────────────────────────────


@router.post("/parse-url")
async def parse_url(payload: ParseUrlPayload):
    """Fetch a URL, extract visible text, then send it to OpenAI."""
    logger.info("chatgpt/parse-url – url=%s, model=%s", payload.url, payload.model)

    fetch_result = await fetch_and_extract(payload.url)
    if not fetch_result["ok"]:
        raise HTTPException(
            status_code=fetch_result.get("status_code", 400),
            detail={
                "success": False,
                "error": fetch_result["error"],
                "status_code": fetch_result.get("status_code"),
            }
        )

    # If structured data extraction succeeded, return directly (skip OpenAI)
    if fetch_result.get("structured_recipe"):
        logger.info("Returning structured data result for %s", payload.url)
        return {"success": True, "data": fetch_result["structured_recipe"]}

    result = await call_openai_chat(
        text=fetch_result["text"][:12_000],
        system_prompt=payload.system_prompt or RECIPE_SYSTEM_PROMPT,
        model=payload.model,
        response_format=payload.response_format or RECIPE_RESPONSE_FORMAT,
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
    )

    return result
