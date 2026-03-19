# "What Can I Make Tonight?" Recommendations

> **Phase:** 3 — Become Part of Meal Planning  
> **Target release:** v2 public (December 1, 2026)  
> **Milestone:** Meal planning launch (December 1, 2026)  
> **Tier:** Pro  
> **Priority:** Medium

---

## Summary

Surface smart recipe recommendations from the user's saved library based on context: what they haven't cooked recently, what fits the available time, and what matches their preferences. "What can I make tonight?" is the question this feature answers.

---

## Value Proposition

- **For users:** Open the app and get immediate, actionable suggestions instead of scrolling. Recommendations reduce decision fatigue — the hardest part of cooking is deciding what to make.
- **For the business:** Recommendations increase daily engagement. A user who opens the app to see "tonight's suggestion" is more likely to build a daily habit. Recommendations also surface recipes that might otherwise be forgotten, increasing library utilization.
- **Retention driver:** Personalized recommendations make the app feel smart and indispensable, raising the perceived value of Pro.

---

## Detailed Instructions

### 1. Recommendation logic

- **Not recently cooked:** Deprioritize recipes cooked in the last 2 weeks (uses cook log from favorites-and-history feature).
- **Time-appropriate:** Weight toward shorter recipes on weeknights, allow longer recipes on weekends.
- **Variety:** Rotate across different cuisines, protein types, and cooking methods if detectable from recipe data.
- **Favorites boost:** Slightly boost recipes in the user's favorites.

### 2. Recommendation UI

- Show a "Tonight's picks" or "What to cook" section at the top of the saved recipes screen or on the home screen.
- Display 3–5 recommended recipes with title, total time, and thumbnail.
- "Refresh" button to get new suggestions.
- Tap to view the recipe; long-press or swipe to add directly to tonight's meal plan slot.

### 3. Context inputs

- Day of week and time of day (weeknight vs weekend, dinner vs lunch).
- Cook log history (avoid recent repeats).
- Saved time filters (if the user typically filters for "under 30 min").
- Dietary preferences (if set in profile — ties to pantry-substitutions feature).

### 4. Progressive improvement

- Start with simple rule-based recommendations (random from library, excluding recently cooked, weighted by favorites).
- Later: use the OpenAI integration for smarter suggestions (e.g., "You've cooked a lot of Italian this week — try this Thai recipe").
- Track which recommendations are tapped vs ignored to improve the algorithm over time.

### 5. Minimum library size

- Recommendations require at least 10 saved recipes to be useful.
- Below 10, show a prompt encouraging the user to save more recipes.

---

## Acceptance Criteria

- [ ] Pro users see a "Tonight's picks" section with 3–5 recommended recipes.
- [ ] Recommendations deprioritize recipes cooked in the last 2 weeks.
- [ ] Recommendations consider time of day and day of week (shorter on weeknights).
- [ ] Favorited recipes receive a slight boost in recommendations.
- [ ] "Refresh" button generates new suggestions.
- [ ] Users can tap a recommendation to view it or add it to the meal plan.
- [ ] Recommendations require at least 10 saved recipes; below that, show a save-more prompt.
- [ ] Recommendation taps vs ignores are tracked for future algorithm improvement.
- [ ] Feature works on iOS, Android, and web.
- [ ] Free users see a locked/preview version with an upgrade prompt.
