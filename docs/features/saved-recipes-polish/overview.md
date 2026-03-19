# Saved Recipes Polish

> **Phase:** 1 — Stabilize and Ship Paid v1  
> **Target release:** Closed beta (April 15, 2026)  
> **Milestone:** Public v1 (May 15, 2026)  
> **Tier:** Free (up to 5) / Pro (unlimited)  
> **Priority:** High

---

## Summary

Refine the saved recipes experience so it feels clean, fast, and reliable. The save flow already exists, but it needs polish before public launch: better UI feedback, loading states, error handling, and a clear indication of the free tier limit.

---

## Value Proposition

- **For users:** Saving a recipe should feel instant and delightful. Users need confidence that their recipes are safe and accessible.
- **For the business:** The saved recipe library is the core retention mechanism. The more recipes a user saves, the harder it is to leave. Polish here directly impacts long-term retention.
- **Conversion driver:** The free tier limit of 5 saved recipes is the primary conversion lever. The UX around hitting that limit must clearly communicate the value of upgrading to Pro.

---

## Detailed Instructions

### 1. Polish the save flow

- Add clear visual feedback when a recipe is saved (animation, toast notification, or similar).
- Show a loading state while the recipe is being saved to the backend.
- Handle save failures gracefully with a retry option.

### 2. Free tier limit UX

- Display the user's current save count relative to the limit (e.g., "3 of 5 recipes saved").
- When the user hits 5 saved recipes, show a clear upgrade prompt — not a hard error.
- Allow the user to delete a saved recipe to make room if they don't want to upgrade.

### 3. Saved recipes list improvements

- Ensure the list loads quickly with pagination or virtualized scrolling for Pro users with large libraries.
- Show recipe title, source domain, and a thumbnail if available.
- Sort by most recently saved by default, with options for alphabetical.

### 4. Recipe detail view

- Display all parsed fields cleanly: title, source URL, ingredients, steps, prep/cook/total time, servings, notes.
- Handle missing fields gracefully — don't show empty sections.
- Provide a link back to the original source URL.

### 5. Delete flow

- Allow users to delete saved recipes with a confirmation prompt.
- Deletion should update the save count immediately.

---

## Acceptance Criteria

- [ ] Saving a recipe shows immediate visual feedback (animation or toast).
- [ ] Loading and error states are present for save, load, and delete operations.
- [ ] Save failures show a user-friendly error with a retry option.
- [ ] Free tier users see their current save count (e.g., "3 of 5").
- [ ] Hitting the 5-recipe limit triggers an upgrade prompt — not a generic error.
- [ ] Free tier users can delete a recipe to free up a slot.
- [ ] Saved recipes list loads in under 1 second for up to 100 recipes.
- [ ] List shows title, source domain, and thumbnail (if available) for each recipe.
- [ ] Recipe detail view displays all parsed fields cleanly and hides empty sections.
- [ ] Delete flow includes a confirmation prompt and updates the count immediately.
- [ ] All saved recipe flows work on iOS, Android, and web.
