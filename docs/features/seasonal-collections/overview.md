# Seasonal Recipe Collections

> **Phase:** 3 — Become Part of Meal Planning  
> **Target release:** v2 public (December 1, 2026)  
> **Milestone:** Meal planning launch (December 1, 2026)  
> **Tier:** Free (browse) / Pro (save from collection)  
> **Priority:** Low

---

## Summary

Curate and surface seasonal recipe collections — themed groups of recipes that match the time of year, holidays, or trending food moments. "Fall comfort food," "Summer grilling," "Holiday baking," "Back to school lunches." Collections give users inspiration and a reason to return to the app even when they're not actively cooking.

---

## Value Proposition

- **For users:** Discover new recipes that match the season without searching. Get inspired by curated collections that feel timely and relevant.
- **For the business:** Collections drive re-engagement, especially during high-activity cooking periods (Thanksgiving, holiday baking, summer BBQ). They also provide a content marketing angle — collections can be shared on social media and linked from the landing page.
- **Conversion lever:** Free users can browse collections, but saving recipes from them counts toward their 5-recipe limit, prompting upgrades.

---

## Detailed Instructions

### 1. Collection structure

- Each collection has: title, description, cover image, list of recipes, and a season/date range for when to surface it.
- Collections are curated by the team (not user-generated, at least initially).
- Recipes in collections are stored as pre-parsed recipe entries (or URLs that are parsed on demand).

### 2. Discovery and surfacing

- Show the current/upcoming seasonal collection on the home screen.
- "Explore" or "Discover" tab with all available collections.
- Collections rotate based on date (e.g., "Holiday Baking" appears November–December).
- Push notification or in-app banner when a new collection launches.

### 3. Interaction

- Users can browse collection recipes without saving.
- Saving a recipe from a collection adds it to the user's library (counts toward free limit).
- "Save all" option to add the entire collection to the library (Pro only).

### 4. Content pipeline

- Plan to launch with 4–6 collections covering the first year's major seasons.
- Identify popular recipes from public sources for each collection.
- Collections should be updatable without an app release (server-side content).

### 5. Analytics

- Track: collection views, individual recipe views within a collection, saves from collection, conversion events triggered by collection saves.

---

## Acceptance Criteria

- [ ] At least 4 seasonal collections are available at launch (one per quarter).
- [ ] Collections display on the home screen when seasonally relevant.
- [ ] "Explore" tab or section lists all available collections.
- [ ] Each collection shows title, description, cover image, and a list of recipes.
- [ ] Users can browse recipes in a collection without saving.
- [ ] Saving a recipe from a collection adds it to the user's library and counts toward limits.
- [ ] "Save all" option is available for Pro users.
- [ ] Collections are server-side managed and updateable without an app release.
- [ ] Collection rotation is date-driven.
- [ ] Analytics track collection views, recipe views, saves, and conversion events.
- [ ] Feature works on iOS, Android, and web.
