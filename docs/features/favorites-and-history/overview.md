# Favorites & History

> **Phase:** 2 — Make the App Sticky  
> **Target release:** v1.1 (July 1, 2026)  
> **Milestone:** Retention release (September 1, 2026)  
> **Tier:** Free (limited history) / Pro (full history + favorites)  
> **Priority:** Medium

---

## Summary

Add a favorites system and a browsing/cooking history to help users quickly access their most-loved and most-recent recipes. Favorites act as a shortlist within the larger library, while history provides a timeline of what's been parsed and viewed.

---

## Value Proposition

- **For users:** Quickly pull up the 5 recipes you cook every week without scrolling. See what you parsed last Tuesday when you forgot to save it. History and favorites reduce friction between "I want to cook" and "I'm cooking."
- **For the business:** Favorites drive habitual use — a user with a favorites list opens the app regularly. History captures recipes that weren't saved, creating re-engagement opportunities and additional save/upgrade prompts.
- **Free tier hook:** Free users get limited recent history, giving them a taste of the feature and motivating an upgrade for full access.

---

## Detailed Instructions

### 1. Favorites

- Add a "heart" / favorite toggle on each saved recipe.
- Favorites appear in a dedicated "Favorites" section or filter in the saved recipes screen.
- Sorted by most recently favorited by default.
- Pro-only: Free users see the heart icon but get an upgrade prompt when tapping.

### 2. Recently cooked

- Add a "Mark as cooked" action on saved recipes.
- "Recently Cooked" section shows the last N recipes marked as cooked, with the date.
- This is distinct from the recipe view history — it's an intentional action.
- Pro feature.

### 3. Import / parse history

- Maintain a history of all URLs the user has submitted for parsing.
- Show: URL, domain, date/time, parse success/failure, and whether the recipe was saved.
- Allow the user to re-parse or save a recipe directly from history.
- Free tier: limited to the last 10 entries. Pro: unlimited history.

### 4. UI integration

- History and favorites are accessible as tabs or filters in the saved recipes screen.
- History can also be accessed from the main parse screen ("Recent" section below the URL input).

### 5. Data model

- `recipe_favorites`: user_id, recipe_id, created_at.
- `cook_log`: user_id, recipe_id, cooked_at.
- `parse_history`: user_id, url, domain, parsed_at, success (bool), recipe_id (nullable).

---

## Acceptance Criteria

- [ ] Pro users can favorite/unfavorite any saved recipe with a heart toggle.
- [ ] Favorites section shows all favorited recipes, sorted by most recently favorited.
- [ ] "Mark as cooked" action is available on saved recipes with a date recorded.
- [ ] "Recently Cooked" section shows the last N recipes cooked with dates.
- [ ] Parse history records every URL submitted, with domain, date, success status, and saved status.
- [ ] Users can re-parse or save a recipe directly from history.
- [ ] Free tier history is limited to the last 10 entries; Pro is unlimited.
- [ ] Free users see an upgrade prompt when tapping the favorite toggle.
- [ ] History and favorites are accessible from the saved recipes screen.
- [ ] Recent parse history is also shown on the main parse screen.
- [ ] All data syncs across devices for Pro users.
