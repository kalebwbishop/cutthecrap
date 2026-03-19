# App Store & Play Store Submission Prep

> **Phase:** 1 — Stabilize and Ship Paid v1  
> **Target release:** May 1, 2026 (submitted before public v1)  
> **Milestone:** Public v1 (May 15, 2026)  
> **Tier:** All tiers  
> **Priority:** Critical

---

## Summary

Prepare and submit the app to the Apple App Store and Google Play Store so it is approved and ready for public download on v1 launch day. This includes store listing assets, compliance requirements, in-app purchase configuration, and the review submission process.

---

## Value Proposition

- **For users:** Download Cut The Crap from their device's app store with confidence — professional listing, clear description, and verified in-app purchases.
- **For the business:** Store presence is required for mobile distribution. Rejection or delays from either store directly block the launch timeline.
- **Credibility:** A polished store listing with screenshots, description, and ratings is one of the highest-impact trust signals for consumer apps.

---

## Detailed Instructions

### 1. Apple App Store preparation

- Register / confirm Apple Developer Program membership.
- Create the App Store Connect listing with:
  - App name, subtitle, and description.
  - Keywords for ASO (App Store Optimization).
  - Screenshots for iPhone and iPad (required sizes).
  - App icon (1024×1024).
  - Privacy policy URL.
  - App category: Food & Drink.
- Configure in-app purchases in App Store Connect for Pro Monthly and Pro Annual via RevenueCat.
- Complete the App Privacy section (data collection disclosure).
- Submit for review with at least 2 weeks buffer before launch.

### 2. Google Play Store preparation

- Register / confirm Google Play Developer account.
- Create the Play Console listing with:
  - App name, short description, and full description.
  - Feature graphic (1024×500), screenshots for phone and tablet.
  - App icon (512×512).
  - Privacy policy URL.
  - App category: Food & Drink.
- Configure in-app purchases via Google Play Billing / RevenueCat.
- Complete the Data Safety section.
- Complete the content rating questionnaire.
- Submit for review with at least 2 weeks buffer before launch.

### 3. Shared assets

- Design consistent screenshots showing the core flow: paste URL → parsed recipe → saved library.
- Write compelling copy that hits the value prop in the first line.
- Prepare a short promo video if resources allow (optional but high-impact).

### 4. Compliance checklist

- Privacy policy covers data collection, analytics, and third-party services (WorkOS, RevenueCat, OpenAI).
- Terms of service are in place.
- COPPA, GDPR, and CCPA considerations are addressed if applicable.
- Export compliance is completed (iOS).

### 5. Pre-launch testing

- Run TestFlight (iOS) and internal testing track (Android) builds to verify the full flow before store submission.
- Verify in-app purchases work in sandbox/test mode on both platforms.

---

## Acceptance Criteria

- [ ] Apple Developer Program and Google Play Developer accounts are active.
- [ ] App Store Connect listing is complete with name, description, keywords, screenshots, icon, and privacy policy.
- [ ] Google Play Console listing is complete with name, descriptions, graphics, screenshots, icon, and privacy policy.
- [ ] In-app purchases (Pro Monthly and Pro Annual) are configured and tested in sandbox on both platforms.
- [ ] App Privacy (iOS) and Data Safety (Android) sections are completed accurately.
- [ ] Content rating questionnaire (Android) is completed.
- [ ] Privacy policy and terms of service are published and linked.
- [ ] TestFlight and internal testing track builds are verified end-to-end.
- [ ] Both apps are submitted for review at least 2 weeks before the May 15 launch.
- [ ] App is approved and ready for public release on both stores by May 15, 2026.
