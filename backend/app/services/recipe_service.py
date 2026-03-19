"""
Recipe extraction service – ports the HTML-parsing and ChatGPT extraction
logic from the frontend recipeApi.ts into server-side Python.
"""

import html
import re
from typing import Any, Optional

import httpx

from app.config.database import get_pool
from app.config.settings import get_settings
from app.utils.logger import logger

# ── constants ────────────────────────────────────────────────────────

REMOVED_TAGS = ["script", "style", "noscript", "svg", "iframe", "template"]
STRUCTURAL_TAGS = ["header", "footer", "nav", "aside", "form"]

FETCH_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15",
}

FETCH_TIMEOUT = 15.0  # seconds

RECIPE_SYSTEM_PROMPT = (
    "You are a recipe extraction assistant. Given the raw text content of a web page, "
    "first determine if the page contains a recipe.\n\n"
    "Set is_recipe to true if the page contains an actual recipe with ingredients and cooking instructions.\n"
    "Set is_recipe to false if the page is not a recipe (e.g. a blog post, news article, homepage, product page, etc.).\n\n"
    "If is_recipe is false, still provide a short title describing what the page is, and set all other fields to null or empty arrays.\n\n"
    "If is_recipe is true, extract the full recipe:\n"
    '- ingredients should be the complete list of individual items with quantities included.\n'
    "- steps should be clear, concise instructions in the same order as the original recipe. Each step has:\n"
    '  - \"instruction\": the step text.\n'
    '  - \"ingredients\": a list of the specific ingredients (with quantities) used in that step. '
    "If no ingredients are used in a step, use an empty list.\n"
    "- notes can include tips, substitutions, storage info, etc. Use an empty array if none.\n"
    "- Extract all relevant time categories when available:\n"
    "  - prep_time: hands-on preparation time (chopping, mixing, etc.)\n"
    "  - cook_time: active cooking time (on the stove, in the oven, etc.)\n"
    "  - cool_time: time for cooling down after cooking\n"
    "  - chill_time: refrigeration or chilling time\n"
    "  - rest_time: resting time (for dough rising, meat resting, etc.)\n"
    "  - marinate_time: time spent marinating\n"
    "  - soak_time: time spent soaking ingredients\n"
    "  - total_time: the overall total time from start to finish\n"
    "- Only include a time category if it genuinely applies. Use null for times that don't apply.\n"
    "- If something is truly not findable, use null for strings or empty arrays for lists.\n"
    "- Clean up any ad copy, SEO filler, or life-story content - just the recipe facts."
)

RECIPE_RESPONSE_FORMAT: dict[str, Any] = {
    "type": "json_schema",
    "json_schema": {
        "name": "recipe_extraction",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "is_recipe": {"type": "boolean"},
                "title": {"type": "string"},
                "description": {"type": ["string", "null"]},
                "prep_time": {"type": ["string", "null"]},
                "cook_time": {"type": ["string", "null"]},
                "cool_time": {"type": ["string", "null"]},
                "chill_time": {"type": ["string", "null"]},
                "rest_time": {"type": ["string", "null"]},
                "marinate_time": {"type": ["string", "null"]},
                "soak_time": {"type": ["string", "null"]},
                "total_time": {"type": ["string", "null"]},
                "servings": {"type": ["string", "null"]},
                "ingredients": {"type": "array", "items": {"type": "string"}},
                "steps": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "instruction": {"type": "string"},
                            "ingredients": {"type": "array", "items": {"type": "string"}},
                        },
                        "required": ["instruction", "ingredients"],
                        "additionalProperties": False,
                    },
                },
                "notes": {"type": "array", "items": {"type": "string"}},
            },
            "required": [
                "is_recipe", "title", "description", "prep_time", "cook_time",
                "cool_time", "chill_time", "rest_time", "marinate_time", "soak_time",
                "total_time", "servings", "ingredients", "steps", "notes",
            ],
            "additionalProperties": False,
        },
    },
}


# ── HTML helpers ─────────────────────────────────────────────────────


def _remove_tag_blocks(text: str, tag_name: str) -> str:
    """Remove all occurrences of <tag …>…</tag> for the given tag name."""
    return re.sub(
        rf"<{tag_name}\b[^>]*>[\s\S]*?</{tag_name}>",
        "\n",
        text,
        flags=re.IGNORECASE,
    )


def extract_title(raw_html: str, fallback: str) -> str:
    """Pull the first <title> text from *raw_html*, falling back to *fallback*."""
    match = re.search(r"<title[^>]*>([\s\S]*?)</title>", raw_html, re.IGNORECASE)
    if match:
        title = html.unescape(match.group(1)).strip()
        title = re.sub(r"\s+", " ", title)
        if title:
            return title
    return fallback


def extract_visible_text(raw_html: str) -> str:
    """Strip tags, decode entities, and return only the visible body text."""
    sanitized = re.sub(r"<!--[\s\S]*?-->", " ", raw_html)

    for tag in [*REMOVED_TAGS, *STRUCTURAL_TAGS]:
        sanitized = _remove_tag_blocks(sanitized, tag)

    # Replace <br> / <hr> with newlines
    sanitized = re.sub(r"<(?:br|hr)\s*/?>", "\n", sanitized, flags=re.IGNORECASE)

    # Block-level closing tags → newline
    block_tags = (
        "address|article|blockquote|caption|dd|div|dl|dt|figcaption|figure|"
        "h[1-6]|li|main|ol|p|pre|section|table|tbody|td|th|thead|tr|ul"
    )
    sanitized = re.sub(
        rf"</(?:{block_tags})>", "\n", sanitized, flags=re.IGNORECASE
    )

    # Strip remaining tags
    sanitized = re.sub(r"<[^>]+>", " ", sanitized)

    # Decode HTML entities and normalize whitespace
    lines: list[str] = []
    prev = ""
    for raw_line in html.unescape(sanitized).splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if line and line != prev:
            lines.append(line)
            prev = line

    return "\n".join(lines)


# ── OpenAI / ChatGPT call ───────────────────────────────────────────


async def call_openai_chat(
    *,
    text: str,
    system_prompt: str,
    model: str = "gpt-4o-mini",
    response_format: Optional[dict[str, Any]] = None,
    temperature: float = 0.2,
    max_tokens: int = 2000,
) -> dict[str, Any]:
    """Forward *text* to the ChatGPT Azure Function at
    ``CHATGPT_API_BASE/api/v1/chatgpt`` and return its response.

    Returns ``{"success": True, "data": <parsed JSON>}`` on success, or
    ``{"success": False, "error": "..."}`` on failure.
    """
    settings = get_settings()
    if not settings.openai_api_key:
        return {"success": False, "error": "OPENAI_API_KEY is not configured on the server."}

    url = f"{settings.chatgpt_api_base.rstrip('/')}/api/v1/chatgpt"

    payload: dict[str, Any] = {
        "text": text[:12_000],
        "system_prompt": system_prompt,
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format:
        payload["response_format"] = response_format

    headers: dict[str, str] = {
        "Content-Type": "application/json",
        "x-api-key": settings.openai_api_key,
    }

    try:
        timeout_seconds = max(len(text) / 100, 10)  # ~100 tokens per second, minimum 10 seconds
        async with httpx.AsyncClient(timeout=timeout_seconds, verify=False) as client:
            resp = await client.post(url, headers=headers, json=payload)
    except httpx.TimeoutException:
        logger.error("Azure Function timed out: %s", url)
        return {"success": False, "error": "ChatGPT API timed out.", "status_code": 408}
    except httpx.RequestError as exc:
        logger.error("Azure Function request error: %s", exc)
        return {"success": False, "error": "Could not reach the ChatGPT API.", "status_code": 0}

    if resp.status_code != 200:
        logger.error("Azure Function error %d: %s", resp.status_code, resp.text[:500])
        return {
            "success": False,
            "error": f"ChatGPT API returned {resp.status_code}",
            "status_code": resp.status_code,
        }

    logger.info("Azure Function response: %s", resp.text[:500])
    return resp.json()


# ── URL fetching ─────────────────────────────────────────────────────


async def fetch_and_extract(url: str) -> dict[str, Any]:
    """Fetch *url*, extract visible text / title, and return them.

    Returns ``{"ok": True, "title": ..., "text": ...}`` on success, or
    ``{"ok": False, "error": ..., "status_code": ...}`` on failure.
    """
    try:
        async with httpx.AsyncClient(
            timeout=FETCH_TIMEOUT,
            follow_redirects=True,
            headers=FETCH_HEADERS,
            verify=False,
        ) as client:
            resp = await client.get(url)
    except httpx.TimeoutException:
        return {"ok": False, "error": "Timed out fetching the URL.", "status_code": 408}
    except httpx.RequestError as exc:
        logger.error("HTTP fetch error for %s: %s", url, exc)
        return {"ok": False, "error": "Could not connect to the URL.", "status_code": 0}

    if resp.status_code != 200:
        return {
            "ok": False,
            "error": f"URL returned HTTP {resp.status_code}.",
            "status_code": resp.status_code,
        }

    raw_html = resp.text

    # Try structured data extraction first (JSON-LD → Microdata → RDFa)
    from app.services.structured_data import extract_structured_recipe

    structured_recipe = extract_structured_recipe(raw_html)
    if structured_recipe:
        title = structured_recipe.get("title", url)
        return {"ok": True, "title": title, "text": "", "structured_recipe": structured_recipe}

    # Fall back to regex-based visible text extraction
    title = extract_title(raw_html, url)
    text = extract_visible_text(raw_html)

    if not text.strip():
        return {"ok": False, "error": "Page loaded but contained no readable text.", "status_code": 0}

    return {"ok": True, "title": title, "text": text}


# ── Saved recipes ────────────────────────────────────────────────────


async def count_saved_recipes(user_id: str) -> int:
    """Return the number of saved recipes for a user."""
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT count(*) AS cnt FROM saved_recipes WHERE user_id = $1",
        user_id,
    )
    return int(row["cnt"]) if row else 0


async def get_saved_recipes(user_id: str) -> list[dict[str, Any]]:
    """Return all saved recipes for a user, newest first."""
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, title, source_url, created_at FROM saved_recipes "
        "WHERE user_id = $1 ORDER BY created_at DESC",
        user_id,
    )
    return [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "sourceUrl": r["source_url"],
            "createdAt": str(r["created_at"]) if r["created_at"] else None,
        }
        for r in rows
    ]


async def get_saved_recipe_by_id(user_id: str, recipe_id: str) -> dict[str, Any] | None:
    """Return a single saved recipe with all fields, or None if not found."""
    import json as _json

    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT * FROM saved_recipes WHERE id = $1 AND user_id = $2",
        recipe_id,
        user_id,
    )
    if not row:
        return None
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
        "ingredients": list(row["ingredients"]) if row["ingredients"] else [],
        "steps": _json.loads(row["steps"]) if isinstance(row["steps"], str) else row["steps"],
        "notes": list(row["notes"]) if row["notes"] else [],
        "createdAt": str(row["created_at"]) if row["created_at"] else None,
    }


async def create_saved_recipe(
    *,
    user_id: str,
    title: str,
    description: str | None = None,
    source_url: str | None = None,
    prep_time: str | None = None,
    cook_time: str | None = None,
    cool_time: str | None = None,
    chill_time: str | None = None,
    rest_time: str | None = None,
    marinate_time: str | None = None,
    soak_time: str | None = None,
    total_time: str | None = None,
    servings: str | None = None,
    ingredients: list[str] | None = None,
    steps: list[Any] | None = None,
    notes: list[str] | None = None,
) -> dict[str, Any]:
    """Insert a new saved recipe and return the row summary."""
    import json as _json

    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO saved_recipes (
            user_id, title, description, source_url,
            prep_time, cook_time, cool_time, chill_time,
            rest_time, marinate_time, soak_time, total_time,
            servings, ingredients, steps, notes
        ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14, $15::jsonb, $16
        ) RETURNING id, title, source_url, created_at
        """,
        user_id,
        title,
        description,
        source_url,
        prep_time,
        cook_time,
        cool_time,
        chill_time,
        rest_time,
        marinate_time,
        soak_time,
        total_time,
        servings,
        ingredients or [],
        _json.dumps(steps or []),
        notes or [],
    )
    if not row:
        raise RuntimeError("Failed to insert saved recipe")
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "sourceUrl": row["source_url"],
        "createdAt": str(row["created_at"]) if row["created_at"] else None,
    }
