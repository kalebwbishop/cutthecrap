"""
Structured data extraction for Schema.org Recipe markup.

Implements a fallback chain: JSON-LD → Microdata → RDFa.
When structured data is found, the recipe can be returned directly
without an OpenAI API call.
"""
from __future__ import annotations

import json
import re
from typing import Any

from bs4 import BeautifulSoup, Tag

from app.utils.logger import logger


# ── ISO 8601 Duration Parsing ────────────────────────────────────────


def parse_iso8601_duration(duration: Any) -> str | None:
    """Convert an ISO 8601 duration like ``PT1H30M`` to ``1 hour 30 minutes``.

    Returns the string as-is if it's already human-readable, or *None*
    if it can't be parsed.
    """
    if not duration or not isinstance(duration, str):
        return None

    match = re.match(
        r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?",
        duration.strip(),
        re.IGNORECASE,
    )
    if not match or not any(match.groups()):
        # Not ISO 8601 — return as-is if it looks human-readable
        cleaned = duration.strip()
        if cleaned and not cleaned.upper().startswith("P"):
            return cleaned
        return None

    days, hours, minutes, seconds = match.groups()
    parts: list[str] = []
    if days:
        d = int(days)
        parts.append(f"{d} day{'s' if d != 1 else ''}")
    if hours:
        h = int(hours)
        parts.append(f"{h} hour{'s' if h != 1 else ''}")
    if minutes:
        m = int(minutes)
        parts.append(f"{m} minute{'s' if m != 1 else ''}")
    if seconds:
        s = int(seconds)
        parts.append(f"{s} second{'s' if s != 1 else ''}")

    return " ".join(parts) if parts else None


# ── Instruction Parsing ──────────────────────────────────────────────


def _extract_step_text(item: Any) -> str | None:
    """Extract instruction text from a HowToStep or similar object."""
    if isinstance(item, str):
        return item.strip() or None
    if isinstance(item, dict):
        text = item.get("text") or item.get("description") or item.get("name")
        return str(text).strip() if text else None
    return None


def _split_instruction_text(text: str) -> list[str]:
    """Split a single instruction block into individual steps."""
    # Try splitting on newlines first
    lines = text.split("\n")
    if len(lines) > 1:
        return [s.strip() for s in lines if s.strip()]

    # Try numbered patterns like "1. " or "1) " (may appear inline)
    parts = re.split(r"\s*\d+[\.\)]\s+", text)
    if len(parts) > 1:
        return [s.strip() for s in parts if s.strip()]

    return [text.strip()] if text.strip() else []


def parse_instructions(instructions: Any) -> list[dict[str, Any]]:
    """Parse Schema.org ``recipeInstructions`` into our step format.

    Handles: single string, list of strings, list of HowToStep objects,
    and list of HowToSection objects containing HowToStep items.
    """
    if not instructions:
        return []

    steps: list[dict[str, Any]] = []

    if isinstance(instructions, str):
        for line in _split_instruction_text(instructions):
            steps.append({"instruction": line, "ingredients": []})
        return steps

    if isinstance(instructions, list):
        for item in instructions:
            if isinstance(item, str):
                for line in _split_instruction_text(item):
                    steps.append({"instruction": line, "ingredients": []})
            elif isinstance(item, dict):
                item_type = item.get("@type", "")
                if item_type == "HowToSection":
                    for sub in item.get("itemListElement", []):
                        text = _extract_step_text(sub)
                        if text:
                            steps.append({"instruction": text, "ingredients": []})
                else:
                    text = _extract_step_text(item)
                    if text:
                        steps.append({"instruction": text, "ingredients": []})

    return steps


# ── Recipe Normalization ─────────────────────────────────────────────


def normalize_recipe(raw: dict[str, Any]) -> dict[str, Any] | None:
    """Map a Schema.org Recipe dict to our response schema.

    Returns *None* if the essential fields (title + at least
    ingredients or steps) are missing.
    """
    title = raw.get("name") or raw.get("headline") or ""
    if isinstance(title, list):
        title = title[0] if title else ""
    title = str(title).strip()
    if not title:
        return None

    ingredients = raw.get("recipeIngredient") or raw.get("ingredients") or []
    if isinstance(ingredients, str):
        ingredients = [ingredients]

    steps = parse_instructions(raw.get("recipeInstructions"))

    if not ingredients and not steps:
        return None

    # Servings — may be string, number, or list
    servings = raw.get("recipeYield")
    if isinstance(servings, list):
        servings = servings[0] if servings else None
    if servings is not None:
        servings = str(servings)

    # Description
    description = raw.get("description")
    if isinstance(description, dict):
        description = description.get("text") or str(description)
    if isinstance(description, list):
        description = description[0] if description else None
    if description:
        description = str(description).strip() or None

    # Notes from auxiliary Schema.org fields
    notes: list[str] = []
    for field, label in (
        ("recipeCategory", "Category"),
        ("recipeCuisine", "Cuisine"),
    ):
        val = raw.get(field)
        if val:
            if isinstance(val, list):
                val = ", ".join(str(v) for v in val)
            val = str(val).strip()
            if val:
                notes.append(f"{label}: {val}")

    return {
        "is_recipe": True,
        "title": title,
        "description": description,
        "prep_time": parse_iso8601_duration(raw.get("prepTime")),
        "cook_time": parse_iso8601_duration(raw.get("cookTime")),
        "cool_time": None,
        "chill_time": None,
        "rest_time": None,
        "marinate_time": None,
        "soak_time": None,
        "total_time": parse_iso8601_duration(raw.get("totalTime")),
        "servings": servings,
        "ingredients": [str(i).strip() for i in ingredients],
        "steps": steps,
        "notes": notes,
    }


# ── JSON-LD Extraction ───────────────────────────────────────────────


def _find_recipe_in_jsonld(data: Any) -> dict[str, Any] | None:
    """Recursively search for a ``@type: Recipe`` in parsed JSON-LD."""
    if isinstance(data, dict):
        obj_type = data.get("@type", "")
        types = obj_type if isinstance(obj_type, list) else [obj_type]
        if "Recipe" in types:
            return data

        # Check @graph array
        if "@graph" in data:
            result = _find_recipe_in_jsonld(data["@graph"])
            if result:
                return result

        for value in data.values():
            if isinstance(value, (dict, list)):
                result = _find_recipe_in_jsonld(value)
                if result:
                    return result

    elif isinstance(data, list):
        for item in data:
            result = _find_recipe_in_jsonld(item)
            if result:
                return result

    return None


def extract_jsonld_recipe(html: str) -> dict[str, Any] | None:
    """Extract a Recipe from ``<script type="application/ld+json">`` tags."""
    soup = BeautifulSoup(html, "lxml")
    scripts = soup.find_all("script", attrs={"type": "application/ld+json"})

    for script in scripts:
        try:
            data = json.loads(script.string or "")
        except (json.JSONDecodeError, TypeError):
            continue

        recipe = _find_recipe_in_jsonld(data)
        if recipe:
            return recipe

    return None


# ── Microdata Extraction ─────────────────────────────────────────────


def _get_itemprop_value(el: Tag) -> str:
    """Extract the value of a Microdata ``itemprop`` element."""
    if el.get("content"):
        return str(el["content"])
    if el.get("datetime"):
        return str(el["datetime"])
    if el.name == "a" and el.get("href"):
        return str(el["href"])
    if el.name == "img" and el.get("src"):
        return str(el["src"])
    if el.name == "meta":
        return str(el.get("content", ""))
    return el.get_text(strip=True)


_MICRODATA_ARRAY_PROPS = frozenset({
    "recipeIngredient", "ingredients", "recipeInstructions",
})


def _parse_microdata_scope(scope_el: Tag) -> dict[str, Any]:
    """Parse a Microdata ``itemscope`` element into a flat dict."""
    result: dict[str, Any] = {}

    for el in scope_el.find_all(attrs={"itemprop": True}):
        # Skip elements belonging to a *deeper* itemscope
        parent_scope = el.find_parent(attrs={"itemscope": True})
        if parent_scope and parent_scope is not scope_el:
            if not el.has_attr("itemscope"):
                continue

        prop = str(el["itemprop"])

        if el.has_attr("itemscope"):
            nested = _parse_microdata_scope(el)
            item_type = str(el.get("itemtype", ""))
            if "HowToStep" in item_type:
                nested["@type"] = "HowToStep"
            elif "HowToSection" in item_type:
                nested["@type"] = "HowToSection"

            if prop in result:
                existing = result[prop]
                result[prop] = (existing if isinstance(existing, list) else [existing])
                result[prop].append(nested)
            else:
                result[prop] = nested
        else:
            value = _get_itemprop_value(el)

            if prop in _MICRODATA_ARRAY_PROPS:
                result.setdefault(prop, []).append(value)
            elif prop in result:
                existing = result[prop]
                result[prop] = (existing if isinstance(existing, list) else [existing])
                result[prop].append(value)
            else:
                result[prop] = value

    return result


def extract_microdata_recipe(html: str) -> dict[str, Any] | None:
    """Extract a Recipe from Microdata (``itemtype`` / ``itemprop``) markup."""
    soup = BeautifulSoup(html, "lxml")
    recipe_el = soup.find(
        attrs={"itemtype": re.compile(r"https?://schema\.org/Recipe", re.IGNORECASE)}
    )
    if not recipe_el or not isinstance(recipe_el, Tag):
        return None
    return _parse_microdata_scope(recipe_el)


# ── RDFa Extraction ──────────────────────────────────────────────────


_RDFA_ARRAY_PROPS = frozenset({
    "recipeIngredient", "ingredients", "recipeInstructions",
})


def _parse_rdfa_scope(scope_el: Tag) -> dict[str, Any]:
    """Parse an RDFa ``typeof`` element into a flat dict."""
    result: dict[str, Any] = {}

    for el in scope_el.find_all(attrs={"property": True}):
        parent_scope = el.find_parent(attrs={"typeof": True})
        if parent_scope and parent_scope is not scope_el:
            if not el.has_attr("typeof"):
                continue

        prop = str(el["property"])
        if ":" in prop:
            prop = prop.split(":")[-1]

        if el.has_attr("typeof"):
            nested = _parse_rdfa_scope(el)
            nested["@type"] = str(el["typeof"])
            if prop in result:
                existing = result[prop]
                result[prop] = (existing if isinstance(existing, list) else [existing])
                result[prop].append(nested)
            else:
                result[prop] = nested
        else:
            value = str(el.get("content", "")) or el.get_text(strip=True)

            if prop in _RDFA_ARRAY_PROPS:
                result.setdefault(prop, []).append(value)
            elif prop in result:
                existing = result[prop]
                result[prop] = (existing if isinstance(existing, list) else [existing])
                result[prop].append(value)
            else:
                result[prop] = value

    return result


def extract_rdfa_recipe(html: str) -> dict[str, Any] | None:
    """Extract a Recipe from RDFa (``typeof`` / ``property``) markup."""
    soup = BeautifulSoup(html, "lxml")
    recipe_el = soup.find(attrs={"typeof": re.compile(r"Recipe", re.IGNORECASE)})
    if not recipe_el or not isinstance(recipe_el, Tag):
        return None
    return _parse_rdfa_scope(recipe_el)


# ── Main Extraction Orchestrator ─────────────────────────────────────


def extract_structured_recipe(html: str) -> dict[str, Any] | None:
    """Try to extract a recipe via structured data: JSON-LD → Microdata → RDFa.

    Returns a normalised recipe dict matching our response schema, or
    *None* if no usable structured data is found.
    """
    extractors = [
        ("json-ld", extract_jsonld_recipe),
        ("microdata", extract_microdata_recipe),
        ("rdfa", extract_rdfa_recipe),
    ]

    for method, extractor in extractors:
        raw = extractor(html)
        if raw:
            recipe = normalize_recipe(raw)
            if recipe:
                logger.info("Structured data extraction succeeded via %s", method)
                return recipe
            logger.debug("Found %s data but normalisation failed", method)

    return None
