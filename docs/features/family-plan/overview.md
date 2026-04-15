# Family Plan (Beta)

> **Phase:** 4 — Social and Household Utility  
> **Target release:** Family/shared beta (February 1, 2027)  
> **Milestone:** Year 1 expansion release (March 19, 2027)  
> **Tier:** Family ($79.99/year)  
> **Priority:** Medium

---

## Summary

Launch the Family plan tier at $79.99/year, offering a shared household experience for up to 5 members. The Family plan bundles all Pro features with household-specific capabilities: shared library, shared meal planner, and collaborative grocery lists.

---

## Value Proposition

- **For users:** One subscription for the whole household. Everyone gets Pro features plus shared recipes, meal planning, and grocery lists. Simpler and cheaper than 2+ individual Pro subscriptions.
- **For the business:** Family plan increases ARPU ($79.99 vs $39.99 for individual Pro Annual). Households are the stickiest subscriber segment — multi-user dependencies make cancellation extremely unlikely. Family plans also bring in users who wouldn't subscribe individually.
- **Price justification:** $79.99/year for 5 members = ~$16/person/year — significantly cheaper than individual Pro for each member.

---

## Detailed Instructions

### 1. Plan definition

- **Price:** $79.99/year.
- **Members:** Up to 5 household members.
- **Includes:** All Pro features + shared library + shared meal planner + collaborative grocery lists.
- Available as an upgrade from Pro Annual or as a direct purchase.

### 2. Subscription management

- Configure the Family plan as separate products in App Store Connect, Google Play Console, and Stripe, with a corresponding `"family"` entitlement key in the backend.
- Ensure it is separate from Pro Monthly and Pro Annual.
- Support upgrade path: Pro Annual → Family (prorated credit for remaining Pro time).
- Support downgrade path: Family → Pro Annual (retain personal data, lose shared features).

### 3. Household setup

- The subscriber (admin) creates the household and invites members (ties into family-library feature).
- Members receive an invite and join without needing their own subscription.
- Members get full Pro access as long as the Family plan is active.
- If the Family plan expires or is cancelled, members revert to Free tier; admin reverts to whatever personal plan they had (or Free).

### 4. Billing and management

- Only the admin is billed.
- Admin can manage members (add/remove) from account settings.
- Show the Family plan details: member list, renewal date, manage/cancel.

### 5. Beta rollout

- Launch as "Beta" with a limited invite or waitlist if needed.
- Collect feedback on household dynamics: what works, what's confusing, what's missing.
- Monitor: Family plan adoption rate, household size distribution, engagement per member, churn vs individual Pro.

---

## Acceptance Criteria

- [ ] Family plan is available for purchase at $79.99/year.
- [ ] Up to 5 household members can be added by the plan admin.
- [ ] All members receive full Pro features while the plan is active.
- [ ] Shared library, shared meal planner, and collaborative grocery lists are accessible to all members.
- [ ] Upgrade path from Pro Annual to Family is available with prorated credit.
- [ ] Downgrade from Family to Pro/Free retains personal data and removes shared access.
- [ ] Only the admin is billed; members join without a separate payment.
- [ ] Admin can add/remove members from account settings.
- [ ] Plan expiration reverts all members to Free and the admin to their fallback plan.
- [ ] Family plan is configured as separate products in App Store Connect, Google Play Console, and Stripe with a dedicated entitlement key.
- [ ] Feature is labeled as "Beta" in the UI.
- [ ] Feature works on iOS, Android, and web.
