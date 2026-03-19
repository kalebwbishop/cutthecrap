# Pantry Substitution Suggestions

> **Phase:** 3 — Become Part of Meal Planning  
> **Target release:** v2 beta (November 1, 2026)  
> **Milestone:** Meal planning launch (December 1, 2026)  
> **Tier:** Pro  
> **Priority:** Low

---

## Summary

Suggest common ingredient substitutions when a user is viewing a recipe — for dietary needs, missing ingredients, or pantry staples. "Don't have buttermilk? Use milk + vinegar." This adds a layer of cooking intelligence that makes the app more helpful than a static recipe card.

---

## Value Proposition

- **For users:** Don't abandon a recipe because you're missing one ingredient. Get smart suggestions that keep you cooking. Especially valuable for dietary restrictions (gluten-free, dairy-free, vegan alternatives).
- **For the business:** Substitution suggestions increase the likelihood that a user actually cooks a recipe — which reinforces the habit of using the app. It also differentiates Cut The Crap from simple recipe scrapers.
- **AI leverage:** This feature can use the existing OpenAI integration to generate contextual substitutions, demonstrating the value of the AI pipeline beyond parsing.

---

## Detailed Instructions

### 1. Substitution display

- On the recipe detail view, show a substitution icon/button next to each ingredient.
- Tapping it reveals a dropdown or tooltip with 1–3 common substitutions.
- Example: "Heavy cream" → "Coconut cream (dairy-free)" or "Greek yogurt (lower fat)."

### 2. Substitution data source

- **Curated database:** Maintain a table of common substitutions for the most frequent ingredients (butter, milk, eggs, flour, sugar, etc.).
- **AI-generated:** For less common ingredients, use the OpenAI integration to generate contextual substitutions on demand.
- Cache AI-generated substitutions to reduce cost and latency on repeat views.

### 3. Dietary filters (stretch goal)

- Allow users to set dietary preferences in their profile (e.g., dairy-free, gluten-free, vegan).
- Highlight relevant substitutions automatically based on preferences.

### 4. User-contributed substitutions (stretch goal)

- Allow Pro users to add their own substitution notes to ingredients.
- These are personal and stored as part of recipe edits (ties into recipe editing feature).

### 5. Cost management

- AI-generated substitutions should be cached after first generation.
- Limit AI calls per recipe view to a reasonable budget.
- Curated substitutions should cover the top 80% of common ingredients without AI.

---

## Acceptance Criteria

- [ ] Pro users see a substitution icon next to ingredients on the recipe detail view.
- [ ] Tapping the icon shows 1–3 suggested substitutions.
- [ ] Curated substitution database covers at least the 50 most common recipe ingredients.
- [ ] AI-generated substitutions are available for ingredients not in the curated database.
- [ ] AI-generated substitutions are cached to avoid repeat API calls.
- [ ] Substitutions include context (e.g., "dairy-free alternative," "lower fat option").
- [ ] Substitution suggestions load in under 2 seconds.
- [ ] Free users see a locked state with an upgrade prompt on the substitution icon.
- [ ] Feature works on iOS, Android, and web.
- [ ] AI substitution costs are monitored and stay within budget limits.
