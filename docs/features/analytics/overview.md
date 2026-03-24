# Analytics Instrumentation

> **Phase:** 1 — Stabilize and Ship Paid v1  
> **Target release:** Closed beta (April 15, 2026)  
> **Milestone:** Public v1 (May 15, 2026)  
> **Tier:** Internal / all tiers  
> **Priority:** High

---

## Summary

Instrument the app and backend with analytics tracking so the team has visibility into user behavior, product health, and business metrics from day one. Without analytics, every product decision is a guess.

---

## Value Proposition

- **For the business:** Data-driven decisions on what to build next, what's broken, and where users drop off. Every metric in the weekly tracking list (growth, product, revenue, reliability) depends on instrumentation being in place.
- **For the product team:** Understand parse success rates, save rates, conversion funnels, and retention cohorts.
- **For reliability:** Track API latency, parsing failure rates by domain, and cost per parse to catch regressions early.

---

## Detailed Instructions

### 1. Choose and integrate an analytics platform

- Evaluate options: Mixpanel, Amplitude, PostHog (self-hosted option), or a lightweight alternative.
- Integrate the SDK on iOS, Android, and web via the Expo app.
- Ensure the backend can also send server-side events (e.g., parse success/failure, subscription events).

### 2. Define and implement core events

**User lifecycle:**
- `user_signed_up` — with auth method
- `user_logged_in` — with platform
- `user_logged_out`
- `session_started` — with platform, app version

**Core product:**
- `recipe_url_submitted` — with URL domain
- `recipe_parsed_success` — with domain, parse time, parse method
- `recipe_parsed_failure` — with domain, error type
- `recipe_saved` — with save count
- `recipe_deleted`
- `recipe_viewed` — from saved library

**Conversion:**
- `paywall_shown` — with trigger (save limit, feature gate, etc.)
- `subscription_started` — with plan, platform
- `subscription_cancelled`
- `subscription_renewed`

**Engagement:**
- `search_performed` (Phase 2+)
- `folder_created` (Phase 2+)
- `grocery_list_generated` (Phase 2+)
- `meal_plan_created` (Phase 3+)

### 3. Set up dashboards

- Create a weekly metrics dashboard covering: new users, WAU, parse success rate, save rate, free-to-paid conversion, churn.
- Create an operational dashboard covering: API latency, parse failure rate by domain, cost per parse, error rates.

### 4. Privacy and compliance

- Ensure analytics comply with app store privacy requirements (App Tracking Transparency on iOS, Google's data safety section).
- Provide a privacy policy that discloses analytics collection.
- Support opt-out if required by regulation.

---

## Acceptance Criteria

- [ ] Analytics SDK is integrated and sending events from iOS, Android, and web.
- [ ] Server-side events are sent from the backend for parse and subscription events.
- [ ] All core lifecycle events (`user_signed_up`, `session_started`, etc.) are tracked.
- [ ] All core product events (`recipe_url_submitted`, `recipe_parsed_success/failure`, `recipe_saved`) are tracked.
- [ ] All conversion events (`paywall_shown`, `subscription_started/cancelled`) are tracked.
- [ ] Weekly metrics dashboard is live and covers growth, product, and revenue metrics.
- [ ] Operational dashboard covers API latency, parse failure rate, and error rates.
- [ ] Analytics implementation complies with iOS App Tracking Transparency and Google data safety requirements.
- [ ] Privacy policy is updated to disclose analytics collection.
- [ ] Event schema is documented for the team.
