import os
import random
import re

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from pydantic import BaseModel, HttpUrl

load_dotenv()

app = FastAPI(title="CutTheCrap API")

# OpenAI client
_api_key = os.getenv("OPENAI_API_KEY")
if not _api_key:
    raise RuntimeError(
        "OPENAI_API_KEY is not set. "
        "Add it to backend/.env or export it as an environment variable."
    )
openai_client = AsyncOpenAI(api_key=_api_key)

# Allow the React dev server (or any configured origin) to call this API
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# System prompt for ChatGPT to extract structured recipe data
RECIPE_SYSTEM_PROMPT = """You are a recipe extraction assistant. Given the raw text content of a web page, first determine if the page contains a recipe.

Set is_recipe to true if the page contains an actual recipe with ingredients and cooking instructions.
Set is_recipe to false if the page is not a recipe (e.g. a blog post, news article, homepage, product page, etc.).

If is_recipe is false, still provide a short title describing what the page is, and leave all other fields as null or empty arrays.

If is_recipe is true, extract the full recipe:
- ingredients should be the complete list of individual items with quantities included.
- steps should be clear, concise instructions in order. Each step is an object with:
  - "instruction": the step text.
  - "ingredients": a list of the specific ingredients (with quantities) used in that step. If no ingredients are used in a step, use an empty list.
- notes can include tips, substitutions, storage info, etc. Use an empty array if none.
- Extract all relevant time categories when available:
  - prep_time: hands-on preparation time (chopping, mixing, etc.)
  - cook_time: active cooking time (on the stove, in the oven, etc.)
  - cool_time: time for cooling down after cooking
  - chill_time: refrigeration or chilling time
  - rest_time: resting time (for dough rising, meat resting, etc.)
  - marinate_time: time spent marinating
  - soak_time: time spent soaking ingredients
  - total_time: the overall total time from start to finish
- Only include a time category if it genuinely applies. Do not fabricate times.
- If something is truly not findable, use null for strings or empty arrays for lists.
- Clean up any ad copy, SEO filler, or life-story content — just the recipe facts."""

# Fun error messages keyed by HTTP status code
STATUS_MESSAGES = {
    400: "🤔 The server said 'nah, bad request.' Maybe the URL is having an identity crisis?",
    401: "🔐 Whoa there! That page wants a password. We don't do break-ins here.",
    403: "🚫 Forbidden fruit! That page doesn't want to be read. Respect its boundaries.",
    404: "👻 Page not found! It's either hiding or it never existed. Spooky.",
    405: "🙅 Method not allowed — we knocked, but apparently we used the wrong hand.",
    408: "⏰ Request timed out. The server went for a coffee break and never came back.",
    429: "🐌 Too many requests! Slow down, speed racer. The server needs a breather.",
    500: "💥 Internal server error! Something blew up on their end. Not our fault, pinky swear.",
    502: "🌉 Bad gateway — the internet bridge is broken. Try swimming across?",
    503: "😴 Service unavailable. The server is napping. Try poking it later.",
    504: "⌛ Gateway timeout. We waited and waited… and then gave up. Classic.",
}

DEFAULT_STATUS_MESSAGES = [
    "🤷 Well, that didn't work. The server responded, but not in a good way.",
    "😬 Awkward… the server sent back something unexpected. Let's pretend this didn't happen.",
    "🫠 The server melted a little. Give it a moment to pull itself together.",
]

EXCEPTION_MESSAGES = [
    "🔌 Connection failed! Either the internet is down or that URL is playing hard to get.",
    "🌪️ Something went sideways. The bits got lost somewhere between here and there.",
    "🧊 Brr… that request went ice cold. Couldn't reach the server at all.",
    "🛸 The request disappeared into the void. Aliens? Maybe. Network error? Definitely.",
    "🔥 This is fine. Everything is fine. (It's not fine — we couldn't connect.)",
    "🐛 A wild bug appeared! Don't worry, we're on it. Probably.",
]


def get_status_error_message(status_code: int) -> str:
    """Return a fun error message for the given HTTP status code."""
    if status_code in STATUS_MESSAGES:
        return STATUS_MESSAGES[status_code]
    return random.choice(DEFAULT_STATUS_MESSAGES)


def get_exception_error_message() -> str:
    """Return a random fun error message for exceptions."""
    return random.choice(EXCEPTION_MESSAGES)


class SummarizeRequest(BaseModel):
    url: HttpUrl


class StepDetail(BaseModel):
    instruction: str
    ingredients: list[str] = []


class RecipeData(BaseModel):
    is_recipe: bool
    title: str
    description: str | None = None
    prep_time: str | None = None
    cook_time: str | None = None
    cool_time: str | None = None
    chill_time: str | None = None
    rest_time: str | None = None
    marinate_time: str | None = None
    soak_time: str | None = None
    total_time: str | None = None
    servings: str | None = None
    ingredients: list[str] = []
    steps: list[StepDetail] = []
    notes: list[str] = []


class SummarizeResponse(BaseModel):
    url: str
    title: str
    is_recipe: bool = True
    summary: str | None = None
    recipe: RecipeData | None = None
    error_code: int | None = None


async def extract_recipe_with_gpt(raw_text: str) -> RecipeData | None:
    """Send scraped text to ChatGPT and get structured recipe data back."""
    try:
        # Truncate to ~12k chars to stay within token limits
        truncated = raw_text[:12000]

        response = await openai_client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": RECIPE_SYSTEM_PROMPT},
                {"role": "user", "content": truncated},
            ],
            response_format=RecipeData,
            temperature=0.2,
            max_tokens=2000,
        )

        return response.choices[0].message.parsed
    except Exception as exc:
        print(f"[GPT extraction error] {exc}")
        return None


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest):
    """Fetch the URL, extract recipe with ChatGPT, and return structured data."""
    url = str(request.url)

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0, verify=False, headers=headers) as client:
            resp = await client.get(url)

        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")

            # Extract the page title
            title_tag = soup.find("title")
            title = title_tag.get_text(strip=True) if title_tag else url

            # Remove script/style tags, then grab visible text
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            raw_text = soup.get_text(separator="\n")
            # Collapse blank lines
            lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
            text = "\n".join(lines)

            # Send to ChatGPT for structured recipe extraction
            recipe = await extract_recipe_with_gpt(text)

            if recipe and recipe.is_recipe:
                return SummarizeResponse(
                    url=url,
                    title=recipe.title,
                    is_recipe=True,
                    recipe=recipe,
                )
            elif recipe and not recipe.is_recipe:
                return SummarizeResponse(
                    url=url,
                    title=recipe.title,
                    is_recipe=False,
                )
            else:
                # Fallback: return raw text if GPT fails
                return SummarizeResponse(url=url, title=title, summary=text)

        # Non-200 — fun error
        msg = get_status_error_message(resp.status_code)
        return SummarizeResponse(
            url=url,
            title="Oops!",
            summary=f"{msg}\n\n📋 Error code: {resp.status_code}",
            error_code=resp.status_code,
        )

    except httpx.TimeoutException:
        return SummarizeResponse(
            url=url,
            title="Oops!",
            summary=f"⏰ The request timed out! That site is slower than a Monday morning.\n\n📋 Error code: TIMEOUT",
            error_code=408,
        )

    except httpx.ConnectError:
        return SummarizeResponse(
            url=url,
            title="Oops!",
            summary=f"🔌 Couldn't connect! Either the site is down or it's ghosting us.\n\n📋 Error code: CONNECTION_FAILED",
            error_code=0,
        )

    except Exception as exc:
        msg = get_exception_error_message()
        return SummarizeResponse(
            url=url,
            title="Oops!",
            summary=f"{msg}\n\n📋 Error code: UNKNOWN\n🔍 Details: {exc}",
            error_code=-1,
        )
