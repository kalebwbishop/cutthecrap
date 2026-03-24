# URL Parsing — Production Hardening

> **Phase:** 1 — Stabilize and Ship Paid v1  
> **Target release:** Closed beta (April 15, 2026)  
> **Milestone:** Public v1 (May 15, 2026)  
> **Tier:** Free + Pro  
> **Priority:** Critical

---

## Summary

Harden the URL-to-recipe parsing pipeline so it works reliably across the widest possible range of recipe sites. This is the core product promise — _"Paste a recipe URL, get just the recipe"_ — and it must be rock-solid before public launch.

Currently the backend uses regex-based HTML extraction, which is fast but brittle across messy or non-standard recipe sites. This feature covers the upgrade path toward robust, production-grade parsing.

---

## Value Proposition

- **For users:** Every URL they paste returns a clean, accurate recipe — no broken results, no blank screens, no missing ingredients.
- **For the business:** Parse reliability directly drives retention and word-of-mouth. A single bad parse can lose a user permanently. High reliability also reduces support tickets and builds trust in the product.
- **Competitive moat:** Speed and accuracy across a wide variety of sites is a core differentiator that is hard for competitors to replicate at scale.

---

## Detailed Instructions

### 1. Audit current parser coverage

- Catalog the top 50 recipe sites by traffic (e.g., AllRecipes, Food Network, Bon Appétit, NYT Cooking, Serious Eats, Tasty, etc.).
- Run automated extraction against a test corpus from each site and record success/failure rates.
- Identify the most common failure patterns (missing structured data, JavaScript-rendered content, paywalled content, non-recipe pages).

### 2. Upgrade extraction strategy

- Prefer JSON-LD / Schema.org `Recipe` structured data when present — this is the most reliable source.
- Fall back to Microdata or RDFa recipe markup.
- Use the existing regex/HTML scraping as a last-resort fallback only.
- Consider integrating a headless browser or pre-rendering service for JavaScript-heavy sites.

### 3. Improve error handling for non-recipe pages

- Detect when a URL is not a recipe (e.g., a blog homepage, a 404, a video page) and return a clear, user-friendly error message.
- Avoid returning partial/garbage data — fail cleanly instead.
- Log failed URLs for analysis and parser improvement.

### 4. Add parsing priority queue for Pro users

- Pro subscribers get faster parsing via a priority queue.
- Free tier parsing remains functional but may queue behind Pro requests during peak load.

### 5. Implement monitoring and alerting

- Track parse success rate by domain in analytics.
- Alert when success rate for any top-50 domain drops below a threshold.
- Dashboard showing parsing failure rate, average parse time, and cost per parse.

---

## Acceptance Criteria

- [ ] JSON-LD / Schema.org `Recipe` extraction is the primary parsing strategy.
- [ ] Fallback chain is implemented: JSON-LD → Microdata → RDFa → HTML scraping.
- [ ] Parse success rate is ≥ 95% across the top 50 recipe sites.
- [ ] Average parse time is under 3 seconds for non-JS-rendered pages.
- [ ] Non-recipe URLs return a clear, user-friendly error message — no partial/garbage data.
- [ ] Failed URLs are logged with domain, URL, and failure reason for analysis.
- [ ] Pro users are routed through a priority parsing queue.
- [ ] Monitoring dashboard tracks parse success rate, latency, and cost per parse.
- [ ] Alerts fire when any top-50 domain success rate drops below 90%.
- [ ] All parsing changes are covered by automated tests against a fixture corpus.
