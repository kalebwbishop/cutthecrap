# Referral Program

> **Phase:** 2 — Make the App Sticky  
> **Target release:** v1.5 (September 1, 2026)  
> **Milestone:** Retention release (September 1, 2026)  
> **Tier:** All tiers  
> **Priority:** Medium

---

## Summary

Implement a referral system where existing users can invite friends and both parties receive a reward. The referral program is a low-cost organic growth loop that compounds over time.

---

## Value Proposition

- **For users:** Invite a friend, and both of you get a free trial of Pro — a genuine reward for sharing something useful.
- **For the business:** Referrals are the lowest-cost acquisition channel. Referred users have higher trust and retention than paid-acquired users. A well-designed referral loop can become the primary growth engine.
- **Unit economics:** If a referred user converts to Pro at even a modest rate, the referral reward (a temporary Pro trial) pays for itself many times over.

---

## Detailed Instructions

### 1. Referral link generation

- Every user (Free and Pro) gets a unique referral link in their profile/settings.
- The link can be shared via native share sheet, copied to clipboard, or sent via the app.
- Link format: `https://cutthecrap.app/r/{referral_code}`

### 2. Referral tracking

- When a new user signs up via a referral link, attribute the signup to the referrer.
- Track: referral link shares, referral signups, referral activations (first parse), referral conversions (to Pro).

### 3. Referral rewards

- **Referrer reward:** When a referred friend signs up and parses their first recipe, the referrer gets a 7-day Pro trial extension (or equivalent credit).
- **Referee reward:** The new user gets a 7-day Pro trial upon signup via a referral link.
- Rewards stack up to a cap (e.g., maximum 30 days of free Pro from referrals).

### 4. Referral UI

- "Invite friends" section in settings/profile with:
  - Unique referral link with copy and share buttons.
  - Count of successful referrals.
  - Earned rewards / remaining Pro trial days.
- Referral prompt at natural moments: after saving a recipe, after a successful parse, after onboarding.

### 5. Anti-abuse measures

- Referral codes are unique per user and single-use per new signup.
- Limit the total reward per user (e.g., 30 days of Pro from referrals).
- Detect and prevent self-referral (same device, same IP pattern).
- Require the referred user to verify their email before the referral is credited.

---

## Acceptance Criteria

- [ ] Every user has a unique referral link accessible from profile/settings.
- [ ] Referral link can be shared via native share sheet or copied to clipboard.
- [ ] New signups via referral link are correctly attributed to the referrer.
- [ ] Referrer receives a 7-day Pro trial extension when the referred user completes first parse.
- [ ] Referred user receives a 7-day Pro trial on signup.
- [ ] Reward cap is enforced (maximum 30 days of Pro from referrals).
- [ ] Referral UI shows link, successful referral count, and earned rewards.
- [ ] Referral prompts appear at natural moments (after save, parse, onboarding).
- [ ] Anti-abuse measures prevent self-referral and duplicate claims.
- [ ] Referred user must verify email before referral is credited.
- [ ] Referral analytics track: link shares, signups, activations, conversions.
