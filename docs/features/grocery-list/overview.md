# Grocery List Generation

> **Phase:** 2 — Make the App Sticky  
> **Target release:** v1.5 (September 1, 2026)  
> **Milestone:** Retention release (September 1, 2026)  
> **Tier:** Pro  
> **Priority:** High

---

## Summary

Generate a grocery/shopping list from the ingredients of one or more saved recipes. This bridges the gap between "I found a recipe" and "I have everything I need to cook it" — a natural next step in the cooking workflow.

---

## Value Proposition

- **For users:** No more manually copying ingredients onto a shopping list. Select recipes, get a consolidated list, check items off as you shop. Saves time and reduces forgotten ingredients.
- **For the business:** Grocery list generation is one of the strongest Pro justifications. It turns Cut The Crap from a parser into a cooking workflow tool. Users who plan meals and shop from the app are deeply engaged.
- **Monetization hook:** This feature can later integrate with grocery delivery partners (Instacart, Amazon Fresh) for affiliate revenue.

---

## Detailed Instructions

### 1. Single recipe grocery list

- On any saved recipe detail view, add a "Generate grocery list" button.
- Extract all ingredients and present them as a checklist.
- Allow users to check off items they already have.
- Allow adding custom items to the list.

### 2. Multi-recipe grocery list

- From the saved recipes screen, allow selecting multiple recipes.
- Generate a consolidated grocery list from all selected recipes.
- Merge duplicate ingredients intelligently (e.g., "1 cup flour" + "2 cups flour" = "3 cups flour").
- Group by category if possible (produce, dairy, protein, pantry, etc.).

### 3. Grocery list management

- Save generated grocery lists for later reference.
- Check off items while shopping (persist checkbox state).
- Share the list via text, email, or native share sheet.
- Clear completed items or reset the list.

### 4. Export options

- Copy list as plain text.
- Share via native share sheet.
- Future: export to Apple Reminders, Google Keep, or grocery delivery apps.

### 5. Ingredient parsing challenges

- Ingredients from different recipes may use different units or formats. Implement best-effort normalization.
- Handle ambiguous or unparseable ingredients gracefully — include them as-is rather than dropping them.

---

## Acceptance Criteria

- [ ] Pro users can generate a grocery list from a single saved recipe.
- [ ] Pro users can select multiple recipes and generate a consolidated grocery list.
- [ ] Duplicate ingredients are merged with quantities combined where possible.
- [ ] Ingredients are grouped by category (produce, dairy, protein, pantry, etc.) when possible.
- [ ] Users can check off items, add custom items, and clear completed items.
- [ ] Grocery lists can be saved and accessed later.
- [ ] Lists can be shared via copy-as-text or native share sheet.
- [ ] Unparseable or ambiguous ingredients appear as-is (no data loss).
- [ ] Grocery list generation works on iOS, Android, and web.
- [ ] Free users see an upgrade prompt when attempting to generate a grocery list.
