# Drag-and-Drop Weekly Meal Planner

> **Phase:** 3 — Become Part of Meal Planning  
> **Target release:** v2 beta (November 1, 2026)  
> **Milestone:** Meal planning launch (December 1, 2026)  
> **Tier:** Pro  
> **Priority:** High

---

## Summary

Build a visual, interactive weekly meal planner where Pro users can drag saved recipes onto a 7-day calendar grid. The meal planner is the flagship Phase 3 feature that transforms Cut The Crap from a recipe utility into a daily kitchen tool.

---

## Value Proposition

- **For users:** Plan your entire week of meals in minutes. See what you're eating at a glance. Reduce the daily "what's for dinner?" stress. Connect directly to grocery list generation for one-tap shopping preparation.
- **For the business:** Meal planning is the strongest subscription justification. Users who plan meals weekly have the highest retention because the app becomes part of their routine. This is the feature that makes Pro "worth it" long-term.
- **Competitive moat:** Combining recipe parsing, a personal library, and meal planning in one seamless experience is hard to replicate. Most competitors offer only one or two of these.

---

## Detailed Instructions

### 1. Calendar grid

- Display a 7-day view (current week by default) with slots for breakfast, lunch, dinner, and snacks.
- Each slot can hold one or more recipes.
- Navigate forward/backward by week.
- Show recipe titles and thumbnails in the grid.

### 2. Adding recipes to the plan

- Drag and drop from the saved recipe library onto a meal slot.
- Alternatively, tap a slot and search/browse saved recipes to add.
- Allow adding the same recipe to multiple slots (e.g., meal prep for the week).
- Allow adding custom/unlinked entries (e.g., "Eat out" or "Leftovers").

### 3. Managing the plan

- Move recipes between slots via drag and drop.
- Remove a recipe from a slot.
- Copy an entire day or week to another date.
- Clear all slots for a given day or week.

### 4. Grocery list integration

- "Generate grocery list from this week's plan" button.
- Consolidates ingredients from all planned recipes (integrates with the grocery list feature).
- Exclude recipes marked as "Eat out" or "Leftovers."

### 5. Responsive design

- On mobile: use a day-by-day swipeable view with a mini week overview.
- On tablet/web: show the full 7-day grid.
- Drag and drop must work on touch (long-press to drag) and desktop (click and drag).

### 6. Data model

- `meal_plans`: user_id, week_start_date.
- `meal_plan_entries`: plan_id, day_of_week, meal_type (breakfast/lunch/dinner/snack), recipe_id (nullable), custom_text (nullable), sort_order.

---

## Acceptance Criteria

- [ ] Pro users see a 7-day meal planner grid with slots for breakfast, lunch, dinner, and snacks.
- [ ] Users can drag and drop saved recipes onto meal slots.
- [ ] Users can tap a slot and search/browse recipes to add.
- [ ] Custom/unlinked entries ("Eat out," "Leftovers") can be added to slots.
- [ ] Recipes can be moved between slots via drag and drop.
- [ ] Recipes can be removed from slots.
- [ ] Copy day/week functionality works.
- [ ] "Generate grocery list from this week" produces a consolidated ingredient list.
- [ ] Week navigation (forward/backward) works.
- [ ] Mobile uses a swipeable day view; tablet/web shows the full grid.
- [ ] Drag and drop works on both touch and desktop.
- [ ] Meal plan data syncs across devices.
- [ ] Free users see the planner in a locked/preview state with an upgrade prompt.
