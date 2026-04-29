"""
Meal-plan generation service.

Builds a prompt from the user's saved recipes + preferences, calls the
shared OpenAI helper, and returns a structured weekly meal plan with a
consolidated grocery list.
"""
from __future__ import annotations

from typing import Any

from app.config.database import get_pool
from app.services.recipe_service import call_openai_chat
from app.utils.logger import logger

# ── constraints ──────────────────────────────────────────────────────

MAX_DAYS = 7
MAX_SELECTED_RECIPES = 10

# ── system prompt ────────────────────────────────────────────────────

MEAL_PLAN_SYSTEM_PROMPT = (
    "You are a meal-planning assistant. The user will provide:\n"
    "1. A set of saved recipes they want included in the plan.\n"
    "2. The number of days and which meals per day to plan.\n\n"
    "Your job:\n"
    "- Create a meal plan that incorporates the user's saved recipes across the requested days/meals.\n"
    "- Fill remaining meal slots with new, simple recipes you generate.\n"
    "- For saved recipes, use the EXACT title provided. Set source to \"saved\" and include the savedRecipeId.\n"
    "- For generated recipes, set source to \"generated\" and leave savedRecipeId as null.\n"
    "- Every meal (saved or generated) must include a title, short description, "
    "estimated prep/cook time, ingredients list, and concise steps.\n"
    "- After the meal plan, produce a consolidated grocery list that merges duplicate "
    "ingredients across all meals (e.g. combine \"2 cups flour\" and \"1 cup flour\" into \"3 cups flour\").\n"
    "- Categorise grocery items (produce, dairy, meat, pantry, etc.).\n"
    "- Keep generated recipes practical, family-friendly, and achievable in under 45 minutes.\n"
    "- Vary cuisines and proteins across the week for balance.\n"
    "- IMPORTANT: Do not copy recipes verbatim from any source. Generate original recipes."
)

MEAL_PLAN_RESPONSE_FORMAT: dict[str, Any] = {
    "type": "json_schema",
    "json_schema": {
        "name": "meal_plan",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "days": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "dayNumber": {"type": "integer"},
                            "meals": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "mealType": {"type": "string"},
                                        "source": {"type": "string", "enum": ["saved", "generated"]},
                                        "savedRecipeId": {"type": ["string", "null"]},
                                        "title": {"type": "string"},
                                        "description": {"type": "string"},
                                        "prepTime": {"type": ["string", "null"]},
                                        "cookTime": {"type": ["string", "null"]},
                                        "ingredients": {"type": "array", "items": {"type": "string"}},
                                        "steps": {"type": "array", "items": {"type": "string"}},
                                    },
                                    "required": [
                                        "mealType", "source", "savedRecipeId", "title",
                                        "description", "prepTime", "cookTime",
                                        "ingredients", "steps",
                                    ],
                                    "additionalProperties": False,
                                },
                            },
                        },
                        "required": ["dayNumber", "meals"],
                        "additionalProperties": False,
                    },
                },
                "groceryList": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "item": {"type": "string"},
                            "quantity": {"type": "string"},
                            "category": {"type": "string"},
                        },
                        "required": ["item", "quantity", "category"],
                        "additionalProperties": False,
                    },
                },
            },
            "required": ["days", "groceryList"],
            "additionalProperties": False,
        },
    },
}

# ── helpers ──────────────────────────────────────────────────────────


def _format_recipe_for_prompt(recipe: dict[str, Any]) -> str:
    """Format a saved recipe row into a concise prompt block."""
    parts = [f"Title: {recipe['title']}"]
    if recipe.get("id"):
        parts.append(f"ID: {recipe['id']}")

    ingredients = recipe.get("ingredients")
    if ingredients:
        parts.append("Ingredients: " + ", ".join(ingredients))

    return "\n".join(parts)


def build_meal_plan_prompt(
    saved_recipes: list[dict[str, Any]],
    days: int,
    meals_per_day: list[str],
) -> str:
    """Build the user-message text sent to GPT."""
    lines: list[str] = []

    if saved_recipes:
        lines.append(f"I have {len(saved_recipes)} saved recipe(s) to include:\n")
        for recipe in saved_recipes:
            lines.append(_format_recipe_for_prompt(recipe))
            lines.append("")
    else:
        lines.append("I have no saved recipes to include — please generate all meals.\n")

    lines.append(f"Please create a {days}-day meal plan.")
    lines.append(f"Meals per day: {', '.join(meals_per_day)}.")
    lines.append(
        "Distribute my saved recipes across the plan where they fit best, "
        "and generate new recipes for the remaining slots."
    )

    return "\n".join(lines)


# ── core generation ──────────────────────────────────────────────────


async def fetch_saved_recipes_by_ids(
    user_id: str, recipe_ids: list[str]
) -> list[dict[str, Any]]:
    """Fetch recipe rows belonging to *user_id* for the given *recipe_ids*."""
    if not recipe_ids:
        return []

    pool = await get_pool()

    placeholders = ", ".join(f"${i + 1}" for i in range(len(recipe_ids)))
    rows = await pool.fetch(
        f"""
        SELECT id, title, ingredients
        FROM saved_recipes
        WHERE id = ANY($1::uuid[]) AND user_id = $2
        """,
        recipe_ids,
        user_id,
    )

    return [dict(r) for r in rows]


async def generate_meal_plan(
    user_id: str,
    selected_recipe_ids: list[str],
    days: int,
    meals_per_day: list[str],
) -> dict[str, Any]:
    """Generate a meal plan via GPT and return the structured result."""

    saved_recipes = await fetch_saved_recipes_by_ids(user_id, selected_recipe_ids)

    # Warn if some IDs didn't match
    found_ids = {str(r["id"]) for r in saved_recipes}
    missing = [rid for rid in selected_recipe_ids if rid not in found_ids]
    if missing:
        logger.warning("Meal plan: %d recipe IDs not found for user %s: %s", len(missing), user_id, missing)

    prompt_text = build_meal_plan_prompt(saved_recipes, days, meals_per_day)
    logger.info(
        "Generating meal plan: %d days, %d meals/day, %d saved recipes, prompt=%d chars",
        days, len(meals_per_day), len(saved_recipes), len(prompt_text),
    )

    result = await call_openai_chat(
        text=prompt_text,
        system_prompt=MEAL_PLAN_SYSTEM_PROMPT,
        model="gpt-5.4-nano",
        response_format=MEAL_PLAN_RESPONSE_FORMAT,
        temperature=0.3,
        max_tokens=4000,
    )

    return result
