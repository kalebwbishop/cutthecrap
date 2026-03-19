# Full-Text Recipe Search

> **Phase:** 2 — Make the App Sticky  
> **Target release:** v1.1 (July 1, 2026)  
> **Milestone:** Retention release (September 1, 2026)  
> **Tier:** Pro  
> **Priority:** High

---

## Summary

Enable Pro users to search across their entire saved recipe library by keyword. Search should cover recipe titles, ingredients, steps, tags, notes, and source domains — making it effortless to find any recipe in seconds.

---

## Value Proposition

- **For users:** "What was that chicken recipe from last month?" Instead of scrolling through dozens of saved recipes, just type "chicken" and find it instantly. Search becomes more valuable as the library grows.
- **For the business:** Search directly increases engagement with the saved library, reinforcing the habit loop. Users who can find recipes quickly cook from them more often, increasing weekly active usage.
- **Pro justification:** Search is one of the strongest Pro-gated features — it becomes essential once a user has more than 10–20 recipes.

---

## Detailed Instructions

### 1. Search scope

- Search across: title, ingredients, steps/instructions, tags, personal notes, and source domain.
- Support partial matches and case-insensitive search.
- Optionally support ingredient-specific search (e.g., "recipes with chicken AND broccoli").

### 2. Search UI

- Search bar at the top of the saved recipes screen (always visible for Pro, locked for Free).
- Results update as the user types (debounced, ~300ms).
- Highlight matching terms in results.
- Show recipe title, matching context snippet, and folder/tags.
- Empty state: "No recipes match your search."

### 3. Backend implementation

- Implement full-text search using PostgreSQL's `tsvector`/`tsquery` or a search service (e.g., Typesense, Meilisearch) if scale demands it.
- Index all searchable fields for each saved recipe.
- Search must return results in under 500ms for libraries up to 1,000 recipes.

### 4. Search filters (optional, can be Phase 2.5)

- Combine search with folder filter and/or tag filter.
- Example: search "pasta" within the "Weeknight Dinners" folder.

### 5. Free tier behavior

- Free users see the search bar in a locked state with an upgrade prompt.
- Search is not available on the Free tier.

---

## Acceptance Criteria

- [ ] Pro users can search across title, ingredients, steps, tags, notes, and source domain.
- [ ] Search is case-insensitive and supports partial matches.
- [ ] Results update as the user types with debounced input (~300ms).
- [ ] Matching terms are highlighted in search results.
- [ ] Results show recipe title, context snippet, and folder/tags.
- [ ] Empty state displays "No recipes match your search" (or similar).
- [ ] Search returns results in under 500ms for libraries up to 1,000 recipes.
- [ ] Full-text search index is maintained for all searchable fields.
- [ ] Free users see a locked search bar with an upgrade prompt.
- [ ] Search works on iOS, Android, and web.
