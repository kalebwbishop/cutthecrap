# Cut The Crap — 12-Month Operating Plan

> **Start date:** March 19, 2026  
> **Core promise:** _"Paste a recipe URL, get just the recipe."_

---

## Executive View

The product already has the bones of a shippable v1:

- URL-to-recipe parsing
- Save recipe flow behind auth
- Free tier with save limit
- RevenueCat entitlement for Pro
- Cross-platform app foundation for iOS, Android, and web

The biggest business opportunity is to move from "cool utility" to "daily kitchen tool." The roadmap prioritizes:

1. Reliability and speed
2. Retention features
3. Subscription justification
4. Low-friction growth loops
5. Unit economics discipline

---

## Recommended Subscription Strategy

Launch with 3 tiers.

### Free — $0

**Best for:** Casual users.

**Features:**

- Unlimited URL parsing
- Up to 5 saved recipes
- Basic recipe view
- Basic dark/light mode
- Limited recent history
- Ads or sponsor slots later, only if needed

> The overview already says the free tier includes 5 saved recipes, so this is the natural entry point.

### Pro Monthly — $4.99/month

**Best for:** Active home cooks.

**Unlocked:**

- Unlimited saved recipes
- Folders / collections
- Search across saved recipes
- Remove ads/sponsor placements
- Faster parsing priority queue
- Meal-plan board
- Shopping list export
- Recipe notes and personal edits
- Sync across devices
- Customer center / subscription management

### Pro Annual — $39.99/year

**Best for:** Retention and cash flow.

**Unlocked:**

- Everything in Pro Monthly
- Annual discount (~$3.33/month)
- Early access to beta features
- "Import from anywhere" tools as they launch

### Optional Future Tier: Family — $79.99/year

> Not launching immediately — kept in the roadmap for households.

**Unlocked:**

- Shared household recipe library
- Shared grocery lists
- Meal planner for multiple people
- 5 household members

---

## Product Roadmap

### Phase 1 — Stabilize and Ship Paid v1

**March 19, 2026 – May 15, 2026**

**Goals:** Turn the current codebase into a clean public launch candidate.

**What ships:**

- Production hardening for URL parsing
- Auth/session reliability improvements
- Subscription activation verification across iOS/Android/Web
- Saved recipes polish
- Better error handling when a page is not a recipe
- Analytics instrumentation
- Landing page with waitlist/referral capture
- App Store / Play Store submission prep
- First pricing/paywall experiments

**Why this phase matters:**

The overview shows some important pre-launch risks:

- No tests
- Tokens are only in memory on frontend
- Regex-based HTML parsing
- Destructive database migration flow
- Stale seed data
- Mixed error handling patterns

Before serious acquisition, these risk areas must be fixed.

> **CEO Milestone — May 15, 2026:** Public v1 launch

---

### Phase 2 — Make the App Sticky

**May 16, 2026 – August 31, 2026**

**Features:**

- Folders / tags for saved recipes
- Full-text search across saved recipes
- Edit title / notes / ingredient cleanup
- Favorites / recently cooked
- Import history
- Share a cleaned recipe card
- Grocery list generation from ingredients
- Onboarding sequence for new users
- Referral reward: invite 1 friend, unlock temporary Pro trial

**Product thesis:**

This phase converts one-time use into repeat use. A parser alone is useful. A personal recipe system is valuable.

**Target outcomes:**

- Higher weekly active usage
- Better free-to-paid conversion
- Lower churn because saved libraries become harder to leave

> **CEO Milestone — September 1, 2026:** Retention release

---

### Phase 3 — Become Part of Meal Planning

**September 1, 2026 – November 30, 2026**

**Features:**

- Drag-and-drop weekly meal planner
- Auto-generated grocery list from chosen recipes
- Servings scaler
- Pantry substitution suggestions
- "Cook time / prep time / total time" filters
- "What can I make tonight?" recommendations from saved recipes
- Seasonal recipe collections

**Why this matters:**

The current schema already stores a rich set of timing fields, servings, ingredients, steps, and notes. That makes meal planning a natural product extension.

> **CEO Milestone — December 1, 2026:** Meal planning launch

---

### Phase 4 — Social and Household Utility

**December 1, 2026 – March 19, 2027**

**Features:**

- Shared family library
- Collaborative grocery lists
- Import from screenshots / pasted text
- "Scan handwritten recipe" beta
- Creator pages / public collections
- Gifting annual subscriptions
- Family plan beta

> **CEO Milestone — March 19, 2027:** Year 1 expansion release  
> _At this point, Cut The Crap stops being only a cleaner and becomes a real kitchen operating system._

---

## Suggested Release Calendar

| Date | Release | Key Outcome |
|------|---------|-------------|
| Mar 19, 2026 | Internal roadmap kickoff | Company operating plan begins |
| Apr 15, 2026 | Closed beta | Fix parsing, auth, paywall, save flow |
| May 15, 2026 | Public v1 | Launch free + Pro |
| Jul 1, 2026 | v1.1 | Folders, notes, search |
| Sep 1, 2026 | v1.5 | Retention release |
| Nov 1, 2026 | v2 beta | Meal planning + grocery list |
| Dec 1, 2026 | v2 public | Stronger Pro value |
| Feb 1, 2027 | Family/shared beta | Household use cases |
| Mar 19, 2027 | Year 1 review | Pricing, CAC, retention, expansion |

---

## Revenue Model Assumptions

> These are scenario-based projections, not forecasts from actual live traffic.

### Base Assumptions (Year 1)

- 150,000 total signups
- 35% monthly active among cumulative users by late year
- 4% convert to paid overall
- 70% of paid users choose annual
- Blended net revenue after app store/payment fees: ~80% of gross
- Lean team and infrastructure discipline

### Estimated Year 1 Revenue

**Paid user estimate:**

150,000 signups × 4% conversion = **6,000 paid users**

| Segment | Calculation | Gross Revenue |
|---------|-------------|---------------|
| 4,200 annual | @ $39.99 | $167,958 |
| 1,800 monthly | @ $4.99 × avg 4 months retained | $35,928 |
| **Estimated subscription gross** | | **$203,886** |

**Additional revenue upside:**

- Affiliate links for cookware/grocery partners: $10,000–$25,000
- Gift subscriptions: $5,000–$15,000
- Limited sponsorship/brand placements: $0–$20,000

**Total Year 1 gross revenue range:** $210,000–$260,000  
**Net revenue after platform/payment fees:** $168,000–$208,000

### Estimated Year 1 Costs

| Category | Range |
|----------|-------|
| AI parsing / model usage | $18,000–$40,000 |
| Backend hosting / database / monitoring | $12,000–$24,000 |
| Auth / subscription tooling / email / analytics | $8,000–$18,000 |
| App store, compliance, misc ops | $3,000–$8,000 |
| Design/contract/support spend | $15,000–$50,000 |
| Paid acquisition experiments | $20,000–$75,000 |
| **Total operating cost range** | **$76,000–$215,000** |

> Not including founder salary or full-time engineering payroll.

### Estimated Year 1 Profit Scenarios

| Scenario | Gross Revenue | Net Revenue | Operating Costs | Operating Profit |
|----------|--------------|-------------|-----------------|-----------------|
| Conservative | $210,000 | $168,000 | $180,000 | −$12,000 |
| Base | $235,000 | $188,000 | $135,000 | $53,000 |
| Strong | $260,000 | $208,000 | $110,000 | $98,000 |

> **Honest CEO take:** Year 1 should be optimized for proving retention and conversion, not maximizing profit. A small profit is nice, but product-market fit is the real win.

---

## Weekly Metrics to Track

### Growth

- New users
- Cost per acquired user
- Referral rate
- Store conversion rate

### Product

- Parse success rate
- Parse accuracy satisfaction score
- Average time to result
- Save-rate after parse
- Weekly active users
- Recipes saved per active user

### Revenue

- Free-to-Pro conversion
- Annual vs monthly mix
- Churn
- Trial conversion
- ARPU
- LTV/CAC ratio

### Reliability

- Parsing failure rate by domain
- Auth/session failure rate
- API latency
- Cost per parse
- Support tickets per 1,000 users

---

## Biggest Risks

1. **Parser reliability risk** — Regex-based HTML extraction is fast, but brittle across messy sites.
2. **Session/auth friction** — The frontend currently has no persistent auth storage, which means sessions do not survive restarts. That hurts retention and paid conversion.
3. **Engineering maturity risk** — No tests, mixed error handling, destructive migrations. Acceptable in pre-launch, but not at scale.
4. **Subscription value risk** — If Pro is only "save more recipes," churn will be high. Pro must become a workflow product: organize, search, plan, shop.
5. **Competitive risk** — The core feature is easy to understand and somewhat easy to imitate. The moat will be: speed, clean UX, reliability across sites, personal recipe library, meal planning workflow, and household collaboration.

---

## Team Summary

From March through May 2026, we launch a stable paid v1. From June through August, we build retention with folders, search, notes, and sharing. From September through December, we make Pro worth paying for with meal planning and grocery tools. By March 2027, we expand into shared household use. If we execute well, Cut The Crap can plausibly finish Year 1 somewhere between break-even and low six-figure annualized profitability, with the real asset being a highly retainable subscription consumer app.

---

## Recommended Pricing Page Copy

**Free**
- Unlimited recipe cleanup
- Save up to 5 recipes
- Basic access

**Pro Monthly — $4.99**
- Unlimited saves
- Search, folders, notes
- Grocery lists
- Meal planning
- Priority parsing
- No ads

**Pro Annual — $39.99**
- Everything in Pro
- Best value
- Early access features
