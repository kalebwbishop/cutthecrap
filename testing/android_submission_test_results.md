# Android / Google Play Submission Checklist — Test Results

**Run date:** 2026-03-27T20:46:43.409Z
**Summary:** 45 passed, 0 failed, 1 warnings, 38 manual

## ⚠️ Warnings

These should be reviewed before submission.

### Backend Production Readiness — CORS wildcard is dev-only

Wildcard "*" appended only in development mode — ensure ENVIRONMENT!=development in production

## ✅ Passed

- **App Build** — Android package name is set: android.package = "com.cutthecrap.app"
- **App Build** — Version number is set: version = "1.0.0"
- **App Build** — Version code is set: android.versionCode = 1
- **App Build** — EAS project ID is set: eas.projectId = "6986e615-2c88-4596-8c5a-f308436657b4"
- **App Build** — eas.json exists: frontend/eas.json found
- **App Build** — Adaptive icon exists: frontend/assets/adaptive-icon.png found
- **App Build** — App icon exists: frontend/assets/icon.png found
- **App Build** — Splash screen exists: frontend/assets/splash.png found
- **App Build** — Deep link scheme configured: scheme = "cutthecrap"
- **App Build** — Adaptive icon background color set: backgroundColor = "#e8a87c"
- **Debug Code** — No console.log/error/warn in frontend src: Clean — no unguarded console statements found
- **Debug Code** — No localhost references in frontend src: Clean
- **Debug Code** — No test/sandbox API keys in frontend src: Clean
- **Debug Code** — No placeholder/coming-soon content: Clean
- **Debug Code** — No TODO comments in frontend src: Clean
- **Functional Completeness** — Account deletion (frontend): Found in 15 file(s)
- **Functional Completeness** — Account deletion (backend): Found in 8 file(s)
- **Functional Completeness** — Logout implemented (frontend): Found in 12 file(s)
- **Functional Completeness** — Logout implemented (backend): Found in 8 file(s)
- **Functional Completeness** — Login/auth flow (frontend): Found in 20 file(s)
- **Functional Completeness** — Error states handled: Error handling found in 16 file(s)
- **Functional Completeness** — Session expiry handling: Found in 13 file(s)
- **Functional Completeness** — Offline/network detection: Found in 10 file(s)
- **Functional Completeness** — Health check integration: Found in 9 file(s)
- **Functional Completeness** — Health endpoint (backend): Found in 15 file(s)
- **Privacy & Permissions** — No unnecessary permission plugins: Only expo-font and expo-web-browser found — appropriate
- **Privacy & Permissions** — No unnecessary Android permissions: No sensitive permissions declared
- **Privacy & Permissions** — Privacy policy screen exists: frontend/src/screens/PrivacyScreen.tsx
- **Privacy & Permissions** — Terms of service screen exists: frontend/src/screens/TermsScreen.tsx
- **Privacy & Permissions** — No advertising/tracking SDKs: Clean — no advertising ID or tracking code found
- **Payments & Subscriptions** — RevenueCat production API keys: No test/sandbox keys detected
- **Payments & Subscriptions** — Restore Purchases implemented: Found in 14 file(s)
- **Payments & Subscriptions** — Paywall screen exists (native): PaywallScreen.tsx found
- **Payments & Subscriptions** — Paywall screen exists (web): PaywallScreen.web.tsx found
- **Payments & Subscriptions** — Pro entitlement constant defined: PRO_ENTITLEMENT found in constants.ts
- **Payments & Subscriptions** — Product IDs defined: monthly/yearly/lifetime found in constants.ts
- **Payments & Subscriptions** — No Stripe SDK imports on native: Stripe SDK only imported in .web.tsx files (correct)
- **Payments & Subscriptions** — Customer center screen exists: CustomerCenterScreen.tsx found
- **Policy Review** — Account deletion available in-app: Found in 14 file(s)
- **Policy Review** — No misleading/placeholder content: Clean
- **Policy Review** — IAP uses RevenueCat/Google Play Billing: Found in 20 file(s)
- **Backend Production Readiness** — No print() debug statements: Clean — all logging uses logger
- **Backend Production Readiness** — No hardcoded secrets in settings: Secrets use env vars with empty defaults
- **Backend Production Readiness** — All auth routes present: login, callback, exchange, refresh, logout, delete — all found
- **Accounts & Review Access** — Test credentials file exists: testing/test_credentials.md found

## 📋 Manual Checks Required

These items cannot be verified automatically and must be checked manually.

- [ ] **Google Play Store Listing** — Short description is finalized: Set in Google Play Console — max 80 characters
- [ ] **Google Play Store Listing** — Full description is finalized: Set in Google Play Console — max 4000 characters
- [ ] **Google Play Store Listing** — App category is selected: Set in Google Play Console (e.g., Food & Drink)
- [ ] **Google Play Store Listing** — Content rating questionnaire completed: Complete the IARC content rating questionnaire in Google Play Console
- [ ] **Google Play Store Listing** — Contact email is set: Required in Google Play Console store listing
- [ ] **Google Play Store Listing** — Privacy policy URL is set: Required by Google Play for apps that collect data
- [ ] **Google Play Store Listing** — Feature graphic uploaded: Required: 1024×500 PNG or JPEG for Google Play listing
- [ ] **Google Play Store Listing** — Screenshots uploaded: Upload phone screenshots (min 2) and tablet if supported
- [ ] **Google Play Store Listing** — Hi-res icon uploaded: Required: 512×512 PNG — auto-generated by EAS if icon.png is correct size
- [ ] **Accounts & Review Access** — Demo account is valid: Verify test credentials work before submission
- [ ] **Accounts & Review Access** — Review notes explain gated features: Document Pro features and free tier limit for Google Play Review
- [ ] **Accounts & Review Access** — Special setup steps documented: Document any special steps for Google Play Review
- [ ] **Release Readiness** — Data Safety section completed: Must declare in Google Play Console: data collected, shared, security practices
- [ ] **Release Readiness** — Data collection disclosures match: Verify Data Safety declarations match actual app behavior
- [ ] **Release Readiness** — Third-party SDK data included: RevenueCat collects: App User ID, purchase history, Android Advertising ID
- [ ] **Release Readiness** — IAP products created in Google Play Console: Verify monthly/yearly/lifetime subscription products
- [ ] **Release Readiness** — App signing key configured: Enroll in Google Play App Signing (recommended) or manage your own keystore
- [ ] **Release Readiness** — AAB uploaded to Google Play Console: Upload via EAS Submit or manual upload (.aab format)
- [ ] **Release Readiness** — Release track selected: Choose internal/closed/open testing or production track
- [ ] **Release Readiness** — Release notes added: Add "What's new" text in Google Play Console
- [ ] **Release Readiness** — Merchant account linked: Required for paid apps/IAP — link Google payments merchant account
- [ ] **Release Readiness** — Target API level compliance: Google Play requires targetSdkVersion ≥ 34 for new apps (Android 14)
- [ ] **Release Readiness** — Subscription config correct: Verify subscription products in Google Play Console match code
- [ ] **Final Smoke Test** — Fresh install works: Test on physical Android device — clean install
- [ ] **Final Smoke Test** — App launches cleanly: Test on supported Android devices
- [ ] **Final Smoke Test** — Main user flows work E2E: Paste URL → extract recipe → save recipe
- [ ] **Final Smoke Test** — No crashes in critical paths: Test all main flows on device
- [ ] **Final Smoke Test** — Sign in works on device: Test WorkOS OAuth flow on Android device
- [ ] **Final Smoke Test** — Sign out works on device: Test logout on Android device
- [ ] **Final Smoke Test** — Purchase flow works: Test with Google Play test account / license testers
- [ ] **Final Smoke Test** — Restore flow works: Test restore purchases on Android device
- [ ] **Final Smoke Test** — Background/foreground transitions: Test app switching, minimize, resume, back button
- [ ] **Final Smoke Test** — Back button behavior correct: Android hardware/gesture back should navigate properly — no unexpected exits
- [ ] **Final Smoke Test** — No UI bugs on supported sizes: Test on small phone, large phone, tablet if supported
- [ ] **Final Smoke Test** — Content matches screenshots: Compare live app with uploaded Google Play screenshots
- [ ] **Final Smoke Test** — Paywall renders correctly on Android: Verify RevenueCat paywall on Android device
- [ ] **Final Smoke Test** — Works on recent Android versions: Test on Android 12+ (API 31+)
- [ ] **Final Smoke Test** — Deep linking works: Test cutthecrap:// scheme opens correct screen
