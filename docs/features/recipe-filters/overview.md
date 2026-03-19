# Recipe Filters — Time, Prep, Cook

> **Phase:** 3 — Become Part of Meal Planning  
> **Target release:** v2 beta (November 1, 2026)  
> **Milestone:** Meal planning launch (December 1, 2026)  
> **Tier:** Pro  
> **Priority:** Medium

---

## Summary

Allow Pro users to filter their saved recipe library by cook time, prep time, and total time. "Show me everything I can make in under 30 minutes" is one of the most common cooking queries — and the parsed recipe data already contains these fields.

---

## Value Proposition

- **For users:** Instantly answer "What can I cook tonight in 30 minutes?" without scrolling through every recipe. Time filters make the library actionable, especially on busy weeknights.
- **For the business:** Filters increase engagement with the saved library. Users who can quickly find a relevant recipe are more likely to cook from the app, reinforcing the daily habit.
- **Data leverage:** The current schema already stores prep time, cook time, and total time. This feature makes that data user-facing with minimal backend work.

---

## Detailed Instructions

### 1. Filter UI

- Add a filter bar or button on the saved recipes screen (alongside search and folders).
- Time filter options:
  - "Under 15 min"
  - "Under 30 min"
  - "Under 60 min"
  - Custom range (min–max minutes)
- Filter by: prep time, cook time, or total time (user selects which).

### 2. Combining filters

- Time filters can be combined with:
  - Folder filter (e.g., "Under 30 min" in "Weeknight Dinners" folder).
  - Tag filter (e.g., "Under 30 min" + "vegetarian" tag).
  - Search query (e.g., "chicken" + "Under 30 min").
- Active filters are displayed as removable chips.

### 3. Missing data handling

- Some recipes may not have time data (parser didn't extract it or source didn't include it).
- Recipes with missing time fields should be shown in a separate "Unknown time" group or excluded from time-filtered results with a note.
- Allow users to manually set/override prep and cook times on recipes with missing data (ties into recipe editing feature).

### 4. Meal planner integration

- When adding a recipe to the meal planner, show the total time next to each recipe for quick reference.
- Optionally filter recipes by time when browsing to add to a meal slot.

---

## Acceptance Criteria

- [ ] Pro users can filter saved recipes by prep time, cook time, or total time.
- [ ] Quick filter options: under 15 min, under 30 min, under 60 min.
- [ ] Custom time range filter is available.
- [ ] Time filters can be combined with folder, tag, and search filters.
- [ ] Active filters display as removable chips.
- [ ] Recipes with missing time data are handled gracefully (separate group or excluded with note).
- [ ] Time data is shown on recipe cards in the saved recipes list.
- [ ] Total time is visible when browsing recipes to add to the meal planner.
- [ ] Filter works on iOS, Android, and web.
- [ ] Free users see filters in a locked state with an upgrade prompt.
