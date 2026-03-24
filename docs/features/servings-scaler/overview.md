# Servings Scaler

> **Phase:** 3 — Become Part of Meal Planning  
> **Target release:** v2 beta (November 1, 2026)  
> **Milestone:** Meal planning launch (December 1, 2026)  
> **Tier:** Pro  
> **Priority:** Medium

---

## Summary

Allow Pro users to scale recipe ingredient quantities up or down by adjusting the number of servings. If a recipe serves 4 but you're cooking for 2 (or 8), all ingredient amounts adjust automatically.

---

## Value Proposition

- **For users:** No more mental math. Scale any recipe to match the number of people you're cooking for. Especially useful for meal prep (scale up) or cooking for one (scale down).
- **For the business:** Servings scaling is a natural quality-of-life feature that adds value to every recipe view. It pairs perfectly with grocery list generation — scale the recipe, then generate a shopping list with the correct quantities.
- **Pro justification:** A small but consistently useful feature that makes the Pro experience feel polished and complete.

---

## Detailed Instructions

### 1. Scaling UI

- Display the current serving count on the recipe detail view (from parsed data or default to "Serves 4" if unknown).
- Provide +/- buttons or a numeric stepper to adjust servings.
- When servings change, all ingredient quantities update in real time.
- Show both original and scaled quantities (e.g., "1 cup → 2 cups") or just the scaled value with a "reset" option.

### 2. Ingredient quantity parsing

- Parse quantities from ingredient text: "2 cups flour," "1/2 tsp salt," "3 large eggs."
- Support common formats: fractions (1/2, 3/4), decimals (0.5), ranges (2–3), and unit abbreviations (tsp, tbsp, oz, lb, g, ml, cups).
- Items without quantities (e.g., "salt to taste," "cooking spray") should not be scaled.

### 3. Scaling logic

- Scale proportionally: if original is 4 servings and user selects 8, multiply all quantities by 2.
- Round to friendly numbers: display "1/3 cup" instead of "0.333 cups."
- Handle non-linear scaling notes if possible (e.g., "don't double the baking powder" — this is a stretch goal, not required for launch).

### 4. Integration with grocery list

- When a scaled recipe is added to a grocery list, use the scaled quantities, not the original.
- When a scaled recipe is added to the meal plan, the scale factor should be preserved.

### 5. Data handling

- Scaling is a view-layer operation — do not permanently modify the saved recipe data.
- The user's chosen scale factor per recipe can optionally be remembered for that session.

---

## Acceptance Criteria

- [ ] Recipe detail view shows the current serving count.
- [ ] Pro users can adjust servings via +/- buttons or a numeric stepper.
- [ ] All ingredient quantities update in real time when servings change.
- [ ] Quantity parsing handles fractions, decimals, ranges, and common unit abbreviations.
- [ ] Items without quantities (e.g., "salt to taste") are not scaled.
- [ ] Scaled quantities are rounded to friendly numbers (e.g., "1/3 cup" not "0.333 cups").
- [ ] Scaling does not permanently modify the saved recipe data.
- [ ] A "reset to original" option restores the original serving count and quantities.
- [ ] Scaled quantities carry over to grocery list generation.
- [ ] Servings scaler works on iOS, Android, and web.
- [ ] Free users see the scaler in a locked state with an upgrade prompt.
