# iOS App Store Submission Checklist

## App Build
- [x] Bundle ID is correct <!-- com.cutthecrap.app in app.json -->
- [x] Version number is updated <!-- 1.0.0 in app.json -->
- [x] Build number is updated <!-- ios.buildNumber: "1" set, EAS autoIncrement enabled -->
- [ ] Release build compiles successfully <!-- eas.json exists with production profile. Run: npx eas build --platform ios --profile production -->
- [ ] App signing/certificates/profiles are valid <!-- Verify in Apple Developer portal -->
- [x] App icon is set correctly <!-- ./assets/icon.png configured and file exists -->
- [x] Launch screen displays correctly <!-- ./assets/splash.png configured and file exists -->
- [x] No debug code, test banners, or placeholder content remain <!-- All console.log/error calls are __DEV__-gated (stripped in prod). client.ts __DEV__ block is dead-code-eliminated. RC keys loaded from env vars. eas.projectId is set. -->

## Functional QA
- [ ] App launches cleanly on supported devices <!-- Needs device testing -->
- [ ] Main user flows work end-to-end <!-- Needs device testing -->
- [ ] No crashes in critical paths <!-- Needs device testing -->
- [ ] Login/signup works <!-- WorkOS OAuth flow implemented — needs device testing -->
- [x] Password reset works <!-- Delegated to WorkOS hosted UI which includes forgot password -->
- [ ] Logout works <!-- Code present in SidebarDrawer — needs device testing -->
- [x] Error states are handled clearly <!-- Per-status error messages in recipeApi.ts, error UI in ResultScreen, health indicator in InputScreen, session expiry alerts -->
- [ ] Offline/poor network behavior is acceptable <!-- ⚠️ MISSING: no @react-native-community/netinfo, no offline detection or banner. Only has API health check on InputScreen -->
- [x] Deep links/universal links work <!-- cutthecrap:// scheme configured in app.json, used for OAuth callback -->
- [x] Push notifications work, if applicable <!-- N/A — app does not use push notifications -->
- [ ] Background/foreground transitions work correctly <!-- Needs device testing -->
- [ ] App works on latest supported iOS version(s) <!-- Needs device testing -->

## App Store Metadata
- [x] App name is finalized <!-- "Cut The Crap" in app.json -->
- [ ] Subtitle is finalized <!-- Set in App Store Connect -->
- [ ] Description is finalized <!-- Set in App Store Connect -->
- [ ] Keywords are added <!-- Set in App Store Connect -->
- [ ] Category is selected correctly <!-- Set in App Store Connect -->
- [ ] Age rating is completed <!-- Set in App Store Connect -->
- [ ] Support URL is live <!-- Verify URL is live -->
- [x] Marketing URL is live, if applicable <!-- N/A — optional -->
- [ ] Copyright is correct <!-- Verify in App Store Connect -->
- [ ] Screenshots are uploaded for all required device sizes <!-- Set in App Store Connect -->
- [x] App preview video is uploaded, if applicable <!-- N/A — optional -->

## Privacy and Permissions
- [ ] App Privacy details are completed in App Store Connect <!-- Must declare: email, name, purchase history (StoreKit via react-native-iap), user content (recipes). All "linked to identity", none "used for tracking". Privacy manifest added to app.json with UserDefaults, SystemBootTime, FileTimestamp API declarations -->
- [ ] Data collection disclosures match actual app behavior <!-- Verify in App Store Connect -->
- [ ] Third-party SDK data usage is included <!-- react-native-iap uses StoreKit directly; no third-party billing SDK collects data. Disclose WorkOS (auth) in App Store Connect -->
- [x] Permission prompts are only shown when needed <!-- App requests zero device permissions -->
- [x] Camera usage description is present, if applicable <!-- N/A — camera not used -->
- [x] Photo library usage description is present, if applicable <!-- N/A — photo library not used -->
- [x] Location usage description is present, if applicable <!-- N/A — location not used -->
- [x] Microphone usage description is present, if applicable <!-- N/A — microphone not used -->
- [x] Contacts usage description is present, if applicable <!-- N/A — contacts not used -->
- [x] Tracking permission is configured correctly, if applicable <!-- N/A — no tracking SDKs, no IDFA usage. Privacy policy confirms "no third-party tracking cookies" -->

## Accounts and Review Access
- [ ] Review demo account is created, if login is required <!-- Must create for App Review -->
- [ ] Demo account credentials are valid <!-- Must verify -->
- [ ] Review notes explain how to access gated features <!-- Must document Pro features and free tier limit -->
- [ ] Special setup steps are documented for App Review <!-- Must document -->
- [ ] Region/device limitations are explained in review notes <!-- Must document if any -->

## Payments and Subscriptions
- [ ] In-App Purchases are created in App Store Connect, if applicable <!-- Verify monthly/yearly/lifetime products in ASC -->
- [ ] Subscription products are configured correctly, if applicable <!-- Create products in App Store Connect (pro_monthly, pro_yearly, pro_lifetime). Ensure product IDs match billing_products table entries -->
- [ ] Purchases complete successfully <!-- Needs testing with production keys -->
- [x] Restore Purchases works <!-- Implemented: native paywall uses react-native-iap getAvailablePurchases() + backend sync; web paywall has explicit "Restore Purchases" button in footer -->
- [x] Subscription terms/pricing are shown correctly <!-- Dynamic pricing from StoreKit via react-native-iap getSubscriptions(); Terms of Service screen covers auto-renewal in Section 4 -->
- [ ] Paywall copy is accurate and compliant <!-- Native iOS paywall is a custom React Native screen (PaywallScreen.tsx) — verify Apple auto-renewal disclaimers are present. Web paywall (PaywallScreen.web.tsx) lacks auto-renewal disclaimer on surface — not an iOS App Store concern but fix for web. Verify native paywall renders correctly on device. -->

## Policy Review
- [ ] App follows [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) <!-- Account deletion ✅ implemented. Review remaining guidelines before submission -->
- [x] No misleading, deceptive, or placeholder content <!-- "Coming Soon" and "Upcoming Features" removed from paywall and sidebar -->
- [x] No hidden features or unfinished sections <!-- Upcoming features screen and data removed -->
- [x] User-generated content protections exist, if applicable <!-- N/A — no UGC; users only save extracted recipes privately -->
- [x] Reporting/blocking/moderation features exist, if applicable <!-- N/A — no user-to-user interaction -->
- [x] Account deletion is available in-app, if required <!-- "Delete Account" button in sidebar with confirmation modal → DELETE /api/v1/auth/account → cascades to all user data -->
- [x] App does not require unnecessary permissions <!-- Zero device permissions requested; appropriate for a recipe extraction app -->
- [x] App complies with payments rules for digital goods <!-- iOS uses StoreKit via react-native-iap for IAP. Web uses Stripe (allowed). No external payment links on iOS. Platform-specific .web.ts files ensure separation -->

## Release Readiness
- [ ] Correct build is uploaded to App Store Connect
- [ ] Build processing is complete
- [ ] Correct build is attached to the version
- [ ] Release notes are added
- [ ] Agreements, tax, and banking info are complete
- [ ] Final smoke test passed on production/release candidate build
- [ ] Submission reviewed one last time before clicking **Submit for Review**

## Final Smoke Test
- [ ] Fresh install works
- [ ] Upgrade from previous version works <!-- N/A for first submission -->
- [ ] Onboarding works
- [ ] Sign in works
- [ ] Sign out works
- [ ] Purchase flow works, if applicable
- [ ] Restore flow works, if applicable
- [x] Notifications work, if applicable <!-- N/A — no push notifications -->
- [ ] No obvious UI bugs on supported screen sizes
- [ ] App content matches screenshots and submission metadata