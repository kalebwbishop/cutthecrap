"""Tests for app.services.structured_data – structured data extraction."""

import os
import pytest

from app.services.structured_data import (
    extract_jsonld_recipe,
    extract_microdata_recipe,
    extract_rdfa_recipe,
    extract_structured_recipe,
    normalize_recipe,
    parse_instructions,
    parse_iso8601_duration,
)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def _load_fixture(name: str) -> str:
    with open(os.path.join(FIXTURES_DIR, name), encoding="utf-8") as f:
        return f.read()


# ═════════════════════════════════════════════════════════════════════
# ISO 8601 Duration Parsing
# ═════════════════════════════════════════════════════════════════════


class TestParseIso8601Duration:
    def test_minutes_only(self):
        assert parse_iso8601_duration("PT15M") == "15 minutes"

    def test_hours_only(self):
        assert parse_iso8601_duration("PT2H") == "2 hours"

    def test_hours_and_minutes(self):
        assert parse_iso8601_duration("PT1H30M") == "1 hour 30 minutes"

    def test_days_hours_minutes(self):
        assert parse_iso8601_duration("P1DT2H30M") == "1 day 2 hours 30 minutes"

    def test_seconds_only(self):
        assert parse_iso8601_duration("PT45S") == "45 seconds"

    def test_singular_units(self):
        assert parse_iso8601_duration("P1DT1H1M1S") == "1 day 1 hour 1 minute 1 second"

    def test_plural_units(self):
        assert parse_iso8601_duration("P2DT3H5M10S") == "2 days 3 hours 5 minutes 10 seconds"

    def test_human_readable_passthrough(self):
        assert parse_iso8601_duration("30 minutes") == "30 minutes"
        assert parse_iso8601_duration("1 hour 15 min") == "1 hour 15 min"

    def test_none_input(self):
        assert parse_iso8601_duration(None) is None

    def test_empty_string(self):
        assert parse_iso8601_duration("") is None

    def test_non_string_input(self):
        assert parse_iso8601_duration(42) is None

    def test_bare_p_no_components(self):
        assert parse_iso8601_duration("P") is None

    def test_lowercase(self):
        assert parse_iso8601_duration("pt30m") == "30 minutes"


# ═════════════════════════════════════════════════════════════════════
# Instruction Parsing
# ═════════════════════════════════════════════════════════════════════


class TestParseInstructions:
    def test_list_of_howto_steps(self):
        instructions = [
            {"@type": "HowToStep", "text": "Step one."},
            {"@type": "HowToStep", "text": "Step two."},
        ]
        steps = parse_instructions(instructions)
        assert len(steps) == 2
        assert steps[0]["instruction"] == "Step one."
        assert steps[1]["instruction"] == "Step two."
        assert steps[0]["ingredients"] == []

    def test_list_of_strings(self):
        instructions = ["Mix the batter.", "Pour into pan.", "Bake for 30 min."]
        steps = parse_instructions(instructions)
        assert len(steps) == 3
        assert steps[0]["instruction"] == "Mix the batter."

    def test_single_string_with_numbers(self):
        text = "1. Preheat oven. 2. Mix ingredients. 3. Bake."
        steps = parse_instructions(text)
        assert len(steps) == 3
        assert "Preheat oven" in steps[0]["instruction"]

    def test_single_string_with_newlines(self):
        text = "Mix flour and sugar.\nAdd eggs.\nBake at 350F."
        steps = parse_instructions(text)
        assert len(steps) == 3

    def test_howto_sections(self):
        instructions = [
            {
                "@type": "HowToSection",
                "name": "Prepare",
                "itemListElement": [
                    {"@type": "HowToStep", "text": "Chop vegetables."},
                    {"@type": "HowToStep", "text": "Marinate chicken."},
                ],
            },
            {
                "@type": "HowToSection",
                "name": "Cook",
                "itemListElement": [
                    {"@type": "HowToStep", "text": "Stir fry everything."},
                ],
            },
        ]
        steps = parse_instructions(instructions)
        assert len(steps) == 3
        assert steps[0]["instruction"] == "Chop vegetables."
        assert steps[2]["instruction"] == "Stir fry everything."

    def test_empty_input(self):
        assert parse_instructions(None) == []
        assert parse_instructions([]) == []
        assert parse_instructions("") == []

    def test_step_with_description_fallback(self):
        instructions = [{"@type": "HowToStep", "description": "Use a spatula."}]
        steps = parse_instructions(instructions)
        assert len(steps) == 1
        assert steps[0]["instruction"] == "Use a spatula."

    def test_step_with_name_fallback(self):
        instructions = [{"@type": "HowToStep", "name": "Preheat Oven"}]
        steps = parse_instructions(instructions)
        assert len(steps) == 1
        assert steps[0]["instruction"] == "Preheat Oven"


# ═════════════════════════════════════════════════════════════════════
# Recipe Normalization
# ═════════════════════════════════════════════════════════════════════


class TestNormalizeRecipe:
    def test_complete_recipe(self):
        raw = {
            "name": "Test Recipe",
            "description": "A test.",
            "prepTime": "PT10M",
            "cookTime": "PT20M",
            "totalTime": "PT30M",
            "recipeYield": "4 servings",
            "recipeIngredient": ["flour", "sugar"],
            "recipeInstructions": [
                {"@type": "HowToStep", "text": "Mix."},
            ],
            "recipeCategory": "Dessert",
            "recipeCuisine": "American",
        }
        result = normalize_recipe(raw)
        assert result is not None
        assert result["is_recipe"] is True
        assert result["title"] == "Test Recipe"
        assert result["description"] == "A test."
        assert result["prep_time"] == "10 minutes"
        assert result["cook_time"] == "20 minutes"
        assert result["total_time"] == "30 minutes"
        assert result["servings"] == "4 servings"
        assert result["ingredients"] == ["flour", "sugar"]
        assert len(result["steps"]) == 1
        assert result["cool_time"] is None
        assert result["chill_time"] is None
        assert "Category: Dessert" in result["notes"]
        assert "Cuisine: American" in result["notes"]

    def test_missing_title_returns_none(self):
        assert normalize_recipe({"recipeIngredient": ["flour"]}) is None

    def test_missing_ingredients_and_steps_returns_none(self):
        assert normalize_recipe({"name": "Empty Recipe"}) is None

    def test_ingredients_only_is_valid(self):
        result = normalize_recipe({
            "name": "Ingredient List",
            "recipeIngredient": ["flour", "sugar"],
        })
        assert result is not None
        assert result["title"] == "Ingredient List"

    def test_steps_only_is_valid(self):
        result = normalize_recipe({
            "name": "Steps Only",
            "recipeInstructions": [
                {"@type": "HowToStep", "text": "Do the thing."},
            ],
        })
        assert result is not None

    def test_servings_as_list(self):
        result = normalize_recipe({
            "name": "Test",
            "recipeYield": ["4", "4 servings"],
            "recipeIngredient": ["flour"],
        })
        assert result["servings"] == "4"

    def test_servings_as_number(self):
        result = normalize_recipe({
            "name": "Test",
            "recipeYield": 6,
            "recipeIngredient": ["flour"],
        })
        assert result["servings"] == "6"

    def test_description_as_dict(self):
        result = normalize_recipe({
            "name": "Test",
            "description": {"text": "A description in a dict."},
            "recipeIngredient": ["flour"],
        })
        assert result["description"] == "A description in a dict."

    def test_all_schema_fields_present(self):
        """Verify the normalized recipe has every required field."""
        raw = {
            "name": "Full Recipe",
            "recipeIngredient": ["flour"],
            "recipeInstructions": [{"@type": "HowToStep", "text": "Mix."}],
        }
        result = normalize_recipe(raw)
        required_fields = {
            "is_recipe", "title", "description", "prep_time", "cook_time",
            "cool_time", "chill_time", "rest_time", "marinate_time", "soak_time",
            "total_time", "servings", "ingredients", "steps", "notes",
        }
        assert set(result.keys()) == required_fields


# ═════════════════════════════════════════════════════════════════════
# JSON-LD Extraction — unit tests
# ═════════════════════════════════════════════════════════════════════


class TestExtractJsonldRecipe:
    def test_simple_recipe(self):
        html = _load_fixture("jsonld_simple.html")
        recipe = extract_jsonld_recipe(html)
        assert recipe is not None
        assert recipe["name"] == "Classic Chocolate Chip Cookies"
        assert len(recipe["recipeIngredient"]) == 9

    def test_graph_recipe(self):
        html = _load_fixture("jsonld_graph.html")
        recipe = extract_jsonld_recipe(html)
        assert recipe is not None
        assert recipe["name"] == "Spaghetti Carbonara"

    def test_multi_type(self):
        html = _load_fixture("jsonld_multi_type.html")
        recipe = extract_jsonld_recipe(html)
        assert recipe is not None
        assert recipe["name"] == "Overnight Oats"

    def test_not_recipe_returns_none(self):
        html = _load_fixture("jsonld_not_recipe.html")
        assert extract_jsonld_recipe(html) is None

    def test_malformed_json_skipped(self):
        html = _load_fixture("jsonld_malformed_first.html")
        recipe = extract_jsonld_recipe(html)
        assert recipe is not None
        assert recipe["name"] == "Recovered Recipe"

    def test_no_jsonld_returns_none(self):
        html = _load_fixture("no_structured_data.html")
        assert extract_jsonld_recipe(html) is None

    def test_empty_html(self):
        assert extract_jsonld_recipe("") is None

    def test_inline_jsonld(self):
        html = '''<html><head>
        <script type="application/ld+json">
        {"@type": "Recipe", "name": "Inline", "recipeIngredient": ["a"]}
        </script></head></html>'''
        recipe = extract_jsonld_recipe(html)
        assert recipe is not None
        assert recipe["name"] == "Inline"


# ═════════════════════════════════════════════════════════════════════
# Microdata Extraction — unit tests
# ═════════════════════════════════════════════════════════════════════


class TestExtractMicrodataRecipe:
    def test_microdata_recipe(self):
        html = _load_fixture("microdata_recipe.html")
        recipe = extract_microdata_recipe(html)
        assert recipe is not None
        assert recipe["name"] == "Chicken Stir Fry"
        assert len(recipe["recipeIngredient"]) == 7
        assert recipe["prepTime"] == "PT15M"

    def test_no_microdata_returns_none(self):
        html = _load_fixture("no_structured_data.html")
        assert extract_microdata_recipe(html) is None

    def test_jsonld_page_no_microdata(self):
        html = _load_fixture("jsonld_simple.html")
        assert extract_microdata_recipe(html) is None

    def test_microdata_instructions_are_list(self):
        html = _load_fixture("microdata_recipe.html")
        recipe = extract_microdata_recipe(html)
        instructions = recipe.get("recipeInstructions", [])
        assert isinstance(instructions, list)
        assert len(instructions) == 4


# ═════════════════════════════════════════════════════════════════════
# RDFa Extraction — unit tests
# ═════════════════════════════════════════════════════════════════════


class TestExtractRdfaRecipe:
    def test_rdfa_recipe(self):
        html = _load_fixture("rdfa_recipe.html")
        recipe = extract_rdfa_recipe(html)
        assert recipe is not None
        assert recipe["name"] == "Greek Salad"
        assert len(recipe["recipeIngredient"]) == 8

    def test_no_rdfa_returns_none(self):
        html = _load_fixture("no_structured_data.html")
        assert extract_rdfa_recipe(html) is None

    def test_jsonld_page_no_rdfa(self):
        html = _load_fixture("jsonld_simple.html")
        assert extract_rdfa_recipe(html) is None

    def test_rdfa_instructions_are_list(self):
        html = _load_fixture("rdfa_recipe.html")
        recipe = extract_rdfa_recipe(html)
        instructions = recipe.get("recipeInstructions", [])
        assert isinstance(instructions, list)
        assert len(instructions) == 3


# ═════════════════════════════════════════════════════════════════════
# Full Extraction Orchestrator — integration tests
# ═════════════════════════════════════════════════════════════════════


class TestExtractStructuredRecipe:
    def test_jsonld_simple_full_extraction(self):
        html = _load_fixture("jsonld_simple.html")
        recipe = extract_structured_recipe(html)
        assert recipe is not None
        assert recipe["is_recipe"] is True
        assert recipe["title"] == "Classic Chocolate Chip Cookies"
        assert recipe["prep_time"] == "15 minutes"
        assert recipe["cook_time"] == "12 minutes"
        assert recipe["total_time"] == "27 minutes"
        assert recipe["servings"] == "24 cookies"
        assert len(recipe["ingredients"]) == 9
        assert "2 1/4 cups all-purpose flour" in recipe["ingredients"]
        assert len(recipe["steps"]) == 7
        assert "Preheat oven" in recipe["steps"][0]["instruction"]
        assert "Category: Dessert" in recipe["notes"]
        assert "Cuisine: American" in recipe["notes"]

    def test_jsonld_graph_full_extraction(self):
        html = _load_fixture("jsonld_graph.html")
        recipe = extract_structured_recipe(html)
        assert recipe is not None
        assert recipe["title"] == "Spaghetti Carbonara"
        assert recipe["prep_time"] == "10 minutes"
        assert recipe["cook_time"] == "20 minutes"
        assert recipe["servings"] == "4 servings"
        assert len(recipe["ingredients"]) == 6
        assert len(recipe["steps"]) == 5

    def test_jsonld_sections_full_extraction(self):
        html = _load_fixture("jsonld_sections.html")
        recipe = extract_structured_recipe(html)
        assert recipe is not None
        assert recipe["title"] == "Easy Banana Bread"
        assert recipe["cook_time"] == "1 hour"
        assert recipe["total_time"] == "1 hour 10 minutes"
        assert len(recipe["ingredients"]) == 8
        assert len(recipe["steps"]) == 5

    def test_jsonld_string_instructions_full_extraction(self):
        html = _load_fixture("jsonld_string_instructions.html")
        recipe = extract_structured_recipe(html)
        assert recipe is not None
        assert recipe["title"] == "Simple Tomato Soup"
        assert len(recipe["ingredients"]) == 5
        assert len(recipe["steps"]) >= 3

    def test_microdata_full_extraction(self):
        html = _load_fixture("microdata_recipe.html")
        recipe = extract_structured_recipe(html)
        assert recipe is not None
        assert recipe["title"] == "Chicken Stir Fry"
        assert recipe["prep_time"] == "15 minutes"
        assert recipe["cook_time"] == "10 minutes"
        assert recipe["total_time"] == "25 minutes"
        assert recipe["servings"] == "4 servings"
        assert len(recipe["ingredients"]) == 7
        assert len(recipe["steps"]) == 4
        assert "Category: Main Course" in recipe["notes"]

    def test_rdfa_full_extraction(self):
        html = _load_fixture("rdfa_recipe.html")
        recipe = extract_structured_recipe(html)
        assert recipe is not None
        assert recipe["title"] == "Greek Salad"
        assert recipe["prep_time"] == "15 minutes"
        assert recipe["cook_time"] is None
        assert recipe["total_time"] == "15 minutes"
        assert recipe["servings"] == "2 servings"
        assert len(recipe["ingredients"]) == 8
        assert len(recipe["steps"]) == 3

    def test_no_structured_data_returns_none(self):
        html = _load_fixture("no_structured_data.html")
        assert extract_structured_recipe(html) is None

    def test_non_recipe_jsonld_returns_none(self):
        html = _load_fixture("jsonld_not_recipe.html")
        assert extract_structured_recipe(html) is None

    def test_malformed_first_jsonld_recovers(self):
        html = _load_fixture("jsonld_malformed_first.html")
        recipe = extract_structured_recipe(html)
        assert recipe is not None
        assert recipe["title"] == "Recovered Recipe"
        assert len(recipe["ingredients"]) == 2

    def test_multi_type_jsonld(self):
        html = _load_fixture("jsonld_multi_type.html")
        recipe = extract_structured_recipe(html)
        assert recipe is not None
        assert recipe["title"] == "Overnight Oats"
        assert recipe["total_time"] == "8 hours 5 minutes"
        assert len(recipe["ingredients"]) == 5

    def test_jsonld_preferred_over_microdata(self):
        """When both JSON-LD and Microdata exist, JSON-LD should win."""
        html = '''<html><head>
        <script type="application/ld+json">
        {"@type": "Recipe", "name": "JSON-LD Version",
         "recipeIngredient": ["flour"], "recipeInstructions": [{"@type": "HowToStep", "text": "Mix."}]}
        </script></head><body>
        <div itemscope itemtype="https://schema.org/Recipe">
          <span itemprop="name">Microdata Version</span>
          <span itemprop="recipeIngredient">sugar</span>
        </div></body></html>'''
        recipe = extract_structured_recipe(html)
        assert recipe is not None
        assert recipe["title"] == "JSON-LD Version"

    def test_all_required_fields_present(self):
        """Every recipe must have all fields from the response schema."""
        html = _load_fixture("jsonld_simple.html")
        recipe = extract_structured_recipe(html)
        required_fields = {
            "is_recipe", "title", "description", "prep_time", "cook_time",
            "cool_time", "chill_time", "rest_time", "marinate_time", "soak_time",
            "total_time", "servings", "ingredients", "steps", "notes",
        }
        assert set(recipe.keys()) == required_fields

    def test_steps_have_correct_shape(self):
        html = _load_fixture("jsonld_simple.html")
        recipe = extract_structured_recipe(html)
        for step in recipe["steps"]:
            assert "instruction" in step
            assert "ingredients" in step
            assert isinstance(step["instruction"], str)
            assert isinstance(step["ingredients"], list)

    def test_empty_html(self):
        assert extract_structured_recipe("") is None

    def test_html_with_only_scripts(self):
        html = "<html><head><script>var x = 1;</script></head><body></body></html>"
        assert extract_structured_recipe(html) is None
