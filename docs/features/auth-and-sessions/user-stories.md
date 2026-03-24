# Auth & Session Reliability: User Stories

> **Phase:** 1 — Stabilize and Ship Paid v1
> **Priority:** Critical

---

## Persistent Login Across Restarts

> **GitHub Issue:** [#6](https://github.com/kalebwbishop/cutthecrap/issues/6)

**As a** user who closes and reopens the app,
**I want** to remain signed in without having to log in again,
**so that** my recipes, settings, and subscription status are always there when I return.

### Acceptance Criteria

- Auth tokens are persisted securely on iOS, Android, and web using platform-appropriate storage (e.g., `expo-secure-store`, `httpOnly` cookies).
- App sessions survive restarts, background kills, and device reboots without re-authentication.
- No tokens are stored in plain text or insecure locations on any platform.

---

## Silent Token Refresh

> **GitHub Issue:** [#7](https://github.com/kalebwbishop/cutthecrap/issues/7)

**As a** returning user whose access token has expired,
**I want** the app to silently refresh my session in the background,
**so that** I never notice token expiration during normal use.

### Acceptance Criteria

- On app launch, the app checks if the access token is expired and uses the refresh token to obtain a new one silently.
- Users are not prompted to log in unless the refresh token itself is expired or revoked.
- If the refresh token is invalid, the user is redirected to login with a clear message (e.g., "Your session expired. Please sign in again.").

---

## Graceful Multi-Device Sessions

> **GitHub Issue:** [#8](https://github.com/kalebwbishop/cutthecrap/issues/8)

**As a** user who accesses Cut The Crap from multiple devices,
**I want** my sessions to work independently on each device,
**so that** signing in on my phone doesn't kick me off my tablet.

### Acceptance Criteria

- Concurrent sessions across multiple devices are handled gracefully.
- Account deletion or subscription revocation while a session is active is handled without crashes or confusing errors.
- A "Sign out everywhere" option is available in account settings.

---

## Clear Auth Error Messages

> **GitHub Issue:** [#9](https://github.com/kalebwbishop/cutthecrap/issues/9)

**As a** user who encounters a login or session problem,
**I want** specific, helpful error messages instead of generic failures,
**so that** I know exactly what went wrong and what to do next.

### Acceptance Criteria

- All generic auth error messages are replaced with specific, actionable ones.
- Auth failures are logged with platform, error code, and token age for debugging.
- Error messages guide the user toward resolution (e.g., "Please sign in again" vs. "Something went wrong").

---

## Consistent Backend Token Validation

> **GitHub Issue:** [#10](https://github.com/kalebwbishop/cutthecrap/issues/10)

**As a** user of the app,
**I want** every protected action to validate my identity consistently,
**so that** my data is secure and no unauthorized access is possible.

### Acceptance Criteria

- All protected API endpoints validate tokens consistently using the WorkOS integration.
- WorkOS session management is correctly configured for all supported auth methods (email/password, social login, magic link).
- Auth flow is tested on iOS, Android, and web before beta launch.
