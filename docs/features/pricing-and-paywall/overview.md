# Pricing & Paywall Experiments

> **Phase:** 1 — Stabilize and Ship Paid v1  
> **Target release:** Closed beta (April 15, 2026)  
> **Milestone:** Public v1 (May 15, 2026)  
> **Tier:** All tiers  
> **Priority:** High

---

## Summary

Implement the in-app paywall experience and run initial pricing experiments during the beta period. The paywall is the primary conversion mechanism from Free to Pro. Getting the design, timing, and messaging right before public launch is essential.

---

## Value Proposition

- **For users:** A clear, honest paywall that explains exactly what they get with Pro — no dark patterns, no confusion.
- **For the business:** The paywall is the revenue engine. Every percentage point improvement in conversion rate multiplies revenue. Experimenting during beta lets us launch with a data-informed paywall.
- **Revenue impact:** At 150,000 Year 1 signups, a 1% conversion rate improvement equals ~1,500 additional paid users — potentially $60,000+ in additional gross revenue.

---

## Detailed Instructions

### 1. Design the paywall screen

- Show all three tiers side by side: Free, Pro Monthly ($4.99), and Pro Annual ($39.99).
- Highlight the annual plan as "Best value" (~$3.33/month).
- List key Pro features: unlimited saves, folders, search, grocery lists, meal planning, priority parsing, no ads.
- Include a "Restore purchases" link for returning users.
- Keep the design clean and consistent with the app's visual language.

### 2. Define paywall triggers

- **Save limit:** When a free user tries to save a 6th recipe, show the paywall.
- **Feature gate:** When a free user taps a Pro-only feature (folders, search, etc.), show the paywall.
- **Soft prompt:** After 3 successful parses, show a non-blocking "Unlock Pro" banner.
- **Settings:** Always accessible from a "Upgrade to Pro" option in settings.

### 3. Run pricing experiments during beta

- Use custom backend feature flags and analytics to A/B test:
  - Different price points (e.g., $3.99 vs $4.99 vs $5.99 monthly).
  - Different annual discounts.
  - Different paywall copy and feature emphasis.
- Track: paywall view rate, tap-through rate, purchase completion rate, plan selection (monthly vs annual).

### 4. Implement free trial option (optional experiment)

- Test offering a 7-day free trial of Pro for new users.
- Track trial-to-paid conversion rate vs direct purchase conversion rate.

### 5. Post-purchase experience

- On successful purchase, show a brief celebration/confirmation.
- Immediately unlock Pro features — no app restart required.
- Send a welcome-to-Pro email with tips on using Pro features.

---

## Acceptance Criteria

- [ ] Paywall screen displays Free, Pro Monthly, and Pro Annual tiers with features and pricing.
- [ ] Annual plan is highlighted as "Best value."
- [ ] "Restore purchases" link is present and functional.
- [ ] Paywall triggers on save limit (6th recipe), Pro feature gate, soft prompt (after 3 parses), and settings.
- [ ] Backend feature flags and analytics are configured for at least one A/B pricing test during beta.
- [ ] Paywall analytics track: view rate, tap-through rate, purchase completion rate, plan selection.
- [ ] Successful purchase immediately unlocks Pro features without requiring an app restart.
- [ ] Post-purchase confirmation is shown in-app.
- [ ] Paywall design is mobile-responsive and works on iOS, Android, and web.
- [ ] At least one pricing experiment has run and produced actionable data before public v1 launch.
