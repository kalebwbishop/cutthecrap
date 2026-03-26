# iOS Submission Checklist — Test Results

**Run date:** 2026-03-25T13:36:35.443Z
**Summary:** 35 passed, 8 failed, 1 warnings, 33 manual

## ❌ Failures

These must be fixed before submitting to the App Store.

### App Build — Build number is set

ios.buildNumber is missing from app.json — required by App Store

### App Build — EAS project ID is set

eas.projectId is empty in app.json — required for EAS Build/Submit

### App Build — eas.json exists

frontend/eas.json not found — required for EAS Build

### Debug Code — No console.log/error/warn in frontend src

Found 3 console statement(s):
  frontend/src/api/recipeApi.ts:158 → console.log('Unexpected response from backend:', response.data);
  frontend/src/store/authStore.ts:79 → console.error('Login failed:', err);
  frontend/src/store/authStore.ts:90 → console.error('Token exchange failed:', err);

### Debug Code — No localhost references in frontend src

Found 1 localhost reference(s):
  frontend/src/api/client.ts:36 → return Platform.OS === 'web' ? 'http://localhost:8000' : 'http://10.0.2.2:8000';

### Debug Code — No test/sandbox API keys in frontend src

Found 3 test/sandbox key(s):
  frontend/src/services/billing/constants.ts:3 → apple: 'test_LzCiuDWzuzhHijTlImsadWTZHXD',
  frontend/src/services/billing/constants.ts:4 → google: 'test_LzCiuDWzuzhHijTlImsadWTZHXD',
  frontend/src/services/billing/constants.ts:5 → web: 'rcb_sb_cWjUatYDoJNLloJFGctoOkvQA',

### Functional Completeness — Offline/network detection

No offline/network detection found — consider adding @react-native-community/netinfo. Apple reviewers may test in airplane mode

### Payments & Subscriptions — RevenueCat production API keys

Still using test_ prefixed key(s) and rcb_sb_ sandbox key(s) in constants.ts — must swap to production keys before release

## ⚠️ Warnings

These should be reviewed before submission.

### Backend Production Readiness — CORS wildcard is dev-only

Wildcard "*" appended only in development mode — ensure ENVIRONMENT!=development in production

## ✅ Passed

- **App Build** — Bundle ID is correct: ios.bundleIdentifier = "com.cutthecrap.app"
- **App Build** — Version number is set: version = "1.0.0"
- **App Build** — App icon exists: frontend/assets/icon.png found
- **App Build** — Splash screen exists: frontend/assets/splash.png found
- **App Build** — Deep link scheme configured: scheme = "cutthecrap"
- **Debug Code** — No placeholder/coming-soon content: Clean
- **Debug Code** — No TODO comments in frontend src: Clean
- **Functional Completeness** — Account deletion (frontend): Found in 15 file(s)
- **Functional Completeness** — Account deletion (backend): Found in 8 file(s)
- **Functional Completeness** — Logout implemented (frontend): Found in 12 file(s)
- **Functional Completeness** — Logout implemented (backend): Found in 8 file(s)
- **Functional Completeness** — Login/auth flow (frontend): Found in 19 file(s)
- **Functional Completeness** — Error states handled: Error handling found in 15 file(s)
- **Functional Completeness** — Session expiry handling: Found in 13 file(s)
- **Functional Completeness** — Health check integration: Found in 9 file(s)
- **Functional Completeness** — Health endpoint (backend): Found in 6 file(s)
- **Privacy & Permissions** — No unnecessary permission plugins: Only expo-font and expo-web-browser found — appropriate
- **Privacy & Permissions** — No unnecessary permission descriptions: No NSUsageDescription keys in infoPlist
- **Privacy & Permissions** — Privacy policy screen exists: frontend/src/screens/PrivacyScreen.tsx
- **Privacy & Permissions** — Terms of service screen exists: frontend/src/screens/TermsScreen.tsx
- **Privacy & Permissions** — No tracking SDKs/IDFA usage: Clean — no tracking code found
- **Payments & Subscriptions** — Restore Purchases implemented: Found in 14 file(s)
- **Payments & Subscriptions** — Paywall screen exists (native): PaywallScreen.tsx found
- **Payments & Subscriptions** — Paywall screen exists (web): PaywallScreen.web.tsx found
- **Payments & Subscriptions** — Pro entitlement constant defined: PRO_ENTITLEMENT found in constants.ts
- **Payments & Subscriptions** — Product IDs defined: monthly/yearly/lifetime found in constants.ts
- **Payments & Subscriptions** — No Stripe SDK imports on iOS: Stripe SDK only imported in .web.tsx files (correct)
- **Payments & Subscriptions** — Customer center screen exists: CustomerCenterScreen.tsx found
- **Policy Review** — Account deletion available in-app: Found in 14 file(s)
- **Policy Review** — No misleading/placeholder content: Clean
- **Policy Review** — IAP uses RevenueCat/StoreKit: Found in 20 file(s)
- **Backend Production Readiness** — No print() debug statements: Clean — all logging uses logger
- **Backend Production Readiness** — No hardcoded secrets in settings: Secrets use env vars with empty defaults
- **Backend Production Readiness** — All auth routes present: login, callback, exchange, refresh, logout, delete — all found
- **Accounts & Review Access** — Test credentials file exists: testing/test_credentials.md found

## 📋 Manual Checks Required

These items cannot be verified automatically and must be checked manually.

- [ ] **App Store Metadata** — Subtitle is finalized: Set in App Store Connect — verify manually
- [ ] **App Store Metadata** — Description is finalized: Set in App Store Connect — verify manually
- [ ] **App Store Metadata** — Keywords are added: Set in App Store Connect — verify manually
- [ ] **App Store Metadata** — Category is selected: Set in App Store Connect — verify manually
- [ ] **App Store Metadata** — Age rating is completed: Set in App Store Connect — verify manually
- [ ] **App Store Metadata** — Support URL is live: Verify the support URL is accessible
- [ ] **App Store Metadata** — Copyright is correct: Set in App Store Connect — verify manually
- [ ] **App Store Metadata** — Screenshots uploaded: Upload for all required device sizes in App Store Connect
- [ ] **Accounts & Review Access** — Demo account is valid: Verify test credentials work before submission
- [ ] **Accounts & Review Access** — Review notes explain gated features: Document Pro features and free tier limit for Apple Review
- [ ] **Accounts & Review Access** — Special setup steps documented: Document any special steps for App Review
- [ ] **Release Readiness** — App Privacy details completed: Must declare in App Store Connect: email, name, purchase history, user content, device identifiers
- [ ] **Release Readiness** — Data collection disclosures match: Verify disclosures match actual app behavior
- [ ] **Release Readiness** — Third-party SDK data included: RevenueCat collects: App User ID, purchase history, IDFV
- [ ] **Release Readiness** — IAP products created in ASC: Verify monthly/yearly/lifetime products in App Store Connect
- [ ] **Release Readiness** — Correct build uploaded to ASC: Upload via EAS Submit or Transporter
- [ ] **Release Readiness** — Build processing complete: Wait for App Store Connect to finish processing
- [ ] **Release Readiness** — Release notes added: Add release notes in App Store Connect
- [ ] **Release Readiness** — Agreements/tax/banking complete: Verify in App Store Connect
- [ ] **Release Readiness** — Subscription config correct: Verify subscription products in App Store Connect match code
- [ ] **Final Smoke Test** — Fresh install works: Test on physical device — clean install
- [ ] **Final Smoke Test** — App launches cleanly: Test on supported devices
- [ ] **Final Smoke Test** — Main user flows work E2E: Paste URL → extract recipe → save recipe
- [ ] **Final Smoke Test** — No crashes in critical paths: Test all main flows on device
- [ ] **Final Smoke Test** — Sign in works on device: Test WorkOS OAuth flow on physical device
- [ ] **Final Smoke Test** — Sign out works on device: Test logout on physical device
- [ ] **Final Smoke Test** — Purchase flow works: Test with sandbox account on device
- [ ] **Final Smoke Test** — Restore flow works: Test restore purchases on device
- [ ] **Final Smoke Test** — Background/foreground transitions: Test app switching, minimize, resume
- [ ] **Final Smoke Test** — No UI bugs on supported sizes: Test on iPhone SE, iPhone 15, iPad if supported
- [ ] **Final Smoke Test** — Content matches screenshots: Compare live app with uploaded App Store screenshots
- [ ] **Final Smoke Test** — Paywall renders correctly on iOS: Verify RevenueCatUI native paywall on device
- [ ] **Final Smoke Test** — Works on latest iOS version: Test on latest supported iOS
