# Auth & Session Reliability

> **Phase:** 1 — Stabilize and Ship Paid v1  
> **Target release:** Closed beta (April 15, 2026)  
> **Milestone:** Public v1 (May 15, 2026)  
> **Tier:** All tiers  
> **Priority:** Critical

---

## Summary

Fix the authentication and session management layer so user sessions persist across app restarts, devices, and platforms. The frontend currently stores tokens only in memory, meaning sessions do not survive restarts. This is a critical barrier to retention and paid conversion.

The backend uses WorkOS for authentication. This feature covers hardening the full auth flow: token persistence, refresh logic, session expiry handling, and graceful degradation.

---

## Value Proposition

- **For users:** Sign in once and stay signed in. Recipes, settings, and subscription status are always there when you open the app — no repeated login friction.
- **For the business:** Session friction is one of the top causes of churn in subscription apps. Users who have to re-authenticate frequently are far less likely to convert to paid or maintain a subscription.
- **Risk mitigation:** The project overview identifies this as a key pre-launch risk. Fixing it before public launch prevents a class of support tickets and negative reviews.

---

## Detailed Instructions

### 1. Implement persistent token storage

- Store auth tokens securely on each platform:
  - **iOS/Android:** Use `expo-secure-store` or equivalent secure keychain/keystore.
  - **Web:** Use `httpOnly` secure cookies or encrypted local storage with appropriate CSRF protections.
- Tokens must survive app restarts, background kills, and device reboots.

### 2. Implement token refresh flow

- On app launch, check if the stored access token is expired.
- If expired, use the refresh token to obtain a new access token silently.
- If the refresh token is also expired or invalid, redirect to the login screen with a clear message.

### 3. Handle session edge cases

- Gracefully handle concurrent sessions across multiple devices.
- Handle the case where a user's account is deleted or subscription is revoked while they have an active session.
- Implement a "sign out everywhere" option in account settings.

### 4. Improve error handling

- Replace any generic auth error messages with specific, actionable ones (e.g., "Your session expired. Please sign in again." instead of "Something went wrong.").
- Log auth failures with context (platform, error code, token age) for debugging.

### 5. Verify WorkOS integration

- Confirm WorkOS session management is correctly configured for all supported auth methods (email/password, social login, magic link if applicable).
- Ensure the backend validates tokens on every protected endpoint consistently.

---

## Acceptance Criteria

- [ ] Auth tokens are persisted securely on iOS, Android, and web using platform-appropriate storage.
- [ ] App sessions survive restarts, background kills, and device reboots without re-authentication.
- [ ] Token refresh flow works silently — users are not prompted to log in unless the refresh token is expired or revoked.
- [ ] Expired or invalid sessions redirect to login with a clear, user-friendly message.
- [ ] Auth failures are logged with platform, error code, and context.
- [ ] "Sign out everywhere" is available in account settings.
- [ ] All protected API endpoints validate tokens consistently.
- [ ] Auth flow is tested on iOS, Android, and web before beta launch.
- [ ] No tokens are stored in plain text or insecure locations on any platform.
