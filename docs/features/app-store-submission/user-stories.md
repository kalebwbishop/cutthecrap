# App Store & Play Store Submission Prep: User Stories

> **Phase:** 1 — Stabilize and Ship Paid v1
> **Priority:** Critical

---

## Professional App Store Listing (iOS)

> **GitHub Issue:** [#16](https://github.com/kalebwbishop/cutthecrap/issues/16)

**As a** potential user browsing the Apple App Store,
**I want** to find a polished, professional listing for Cut The Crap with clear screenshots and a compelling description,
**so that** I trust the app enough to download it.

### Acceptance Criteria

- App Store Connect listing is complete with name, subtitle, description, keywords, screenshots (iPhone and iPad), icon (1024×1024), and privacy policy URL.
- App category is set to Food & Drink.
- App Privacy section (data collection disclosure) is completed accurately.
- In-app purchases (Pro Monthly and Pro Annual) are configured in App Store Connect using StoreKit (handled client-side via react-native-iap).

---

## Professional Play Store Listing (Android)

> **GitHub Issue:** [#17](https://github.com/kalebwbishop/cutthecrap/issues/17)

**As a** potential user browsing Google Play,
**I want** to find a polished, professional listing for Cut The Crap with clear graphics and a compelling description,
**so that** I trust the app enough to install it.

### Acceptance Criteria

- Play Console listing is complete with name, short description, full description, feature graphic (1024×500), screenshots (phone and tablet), icon (512×512), and privacy policy URL.
- App category is set to Food & Drink.
- Data Safety section is completed accurately.
- Content rating questionnaire is completed.
- In-app purchases are configured via Google Play Billing (handled client-side via react-native-iap).

---

## Consistent Store Screenshots

> **GitHub Issue:** [#18](https://github.com/kalebwbishop/cutthecrap/issues/18)

**As a** potential user on either app store,
**I want** screenshots that clearly show the core app experience — paste a URL, see a clean recipe, browse my saved library,
**so that** I understand the value before downloading.

### Acceptance Criteria

- Screenshots are designed consistently across both stores.
- The core flow is shown: paste URL → parsed recipe → saved library.
- Copy in the first line of the store description hits the core value proposition.

---

## Legal and Privacy Compliance

> **GitHub Issue:** [#19](https://github.com/kalebwbishop/cutthecrap/issues/19)

**As a** user concerned about my data and privacy,
**I want** the app to have a published privacy policy and terms of service that clearly explain data practices,
**so that** I know my information is handled responsibly.

### Acceptance Criteria

- Privacy policy covers data collection, analytics, and third-party services (WorkOS, Stripe, OpenAI).
- Terms of service are in place and publicly accessible.
- COPPA, GDPR, and CCPA considerations are addressed where applicable.
- Export compliance is completed (iOS).

---

## Pre-Launch Verification Builds

> **GitHub Issue:** [#20](https://github.com/kalebwbishop/cutthecrap/issues/20)

**As a** member of the team preparing for launch,
**I want** TestFlight and internal testing track builds to be verified end-to-end before store submission,
**so that** we catch any issues before real users or reviewers see the app.

### Acceptance Criteria

- TestFlight (iOS) and internal testing track (Android) builds are deployed and verified.
- In-app purchases work in sandbox/test mode on both platforms.
- Both apps are submitted for review at least 2 weeks before the May 15 launch.
- Apps are approved and ready for public release on both stores by May 15, 2026.
