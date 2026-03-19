# Onboarding Sequence

> **Phase:** 2 — Make the App Sticky  
> **Target release:** v1.1 (July 1, 2026)  
> **Milestone:** Retention release (September 1, 2026)  
> **Tier:** All tiers  
> **Priority:** Medium

---

## Summary

Design and implement a guided onboarding experience for new users that demonstrates the core value within 60 seconds: paste a URL, see the clean recipe, save it. A strong onboarding flow is the single biggest lever for activation and retention.

---

## Value Proposition

- **For users:** Understand exactly how the app works and get their first "aha moment" immediately. No confusion, no abandoned installs.
- **For the business:** Onboarding directly impacts activation rate. Users who complete onboarding and parse their first recipe are significantly more likely to return and eventually convert to Pro.
- **Metric impact:** Improving onboarding completion from 50% to 80% could double the effective conversion funnel.

---

## Detailed Instructions

### 1. First-launch onboarding flow

- **Screen 1 — Welcome:** "Paste a recipe URL, get just the recipe." Brief value prop with a clean visual.
- **Screen 2 — Try it now:** Pre-filled URL input with a popular recipe URL. User taps "Clean it" and sees the result instantly.
- **Screen 3 — Save it:** Prompt to save the parsed recipe. Explain the 5-recipe free limit and what Pro unlocks.
- **Screen 4 — You're ready:** Brief overview of key features (search, folders, grocery list for Pro) and a CTA to start using the app.

### 2. Auth timing

- Allow the user to experience the first parse without requiring sign-up.
- Prompt for sign-up/sign-in when they try to save a recipe.
- This "value-first, auth-second" flow reduces drop-off.

### 3. Progressive disclosure

- Don't overwhelm new users with every feature. Introduce features contextually:
  - After saving 3 recipes: "Did you know you can organize recipes into folders? (Pro)"
  - After viewing a saved recipe: "Add personal notes to any recipe (Pro)"
  - After 1 week of use: "Plan your meals for the week (Pro)"

### 4. Skip option

- All onboarding screens have a "Skip" option for returning users or those who want to jump in.
- Skipped onboarding can be revisited from settings ("Tutorial" or "How it works").

### 5. Onboarding analytics

- Track: onboarding started, each screen viewed, onboarding completed, onboarding skipped.
- Track time-to-first-parse and time-to-first-save as activation metrics.

---

## Acceptance Criteria

- [ ] New users see a 3–4 screen onboarding flow on first launch.
- [ ] Onboarding includes a live parse demo with a pre-filled URL.
- [ ] Users can parse a recipe before signing up (value-first).
- [ ] Sign-up is prompted when the user tries to save a recipe.
- [ ] All onboarding screens have a "Skip" option.
- [ ] Skipped onboarding is accessible later from settings.
- [ ] Progressive disclosure tooltips appear contextually after specific user actions.
- [ ] Onboarding analytics track: started, each screen, completed, skipped, time-to-first-parse, time-to-first-save.
- [ ] Onboarding flow works on iOS, Android, and web.
- [ ] Onboarding completes in under 60 seconds for users who follow the guided flow.
