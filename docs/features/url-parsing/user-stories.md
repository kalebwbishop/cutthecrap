# URL Parsing — Production Hardening: User Stories

> **Phase:** 1 — Stabilize and Ship Paid v1
> **Priority:** Critical

---

## Structured Data Extraction

> **GitHub Issue:** [#1](https://github.com/kalebwbishop/cutthecrap/issues/1)

**As a** user pasting a recipe URL,
**I want** the parser to extract recipe data from JSON-LD / Schema.org markup first,
**so that** I get the most accurate and complete recipe possible.

### Acceptance Criteria

- JSON-LD `Recipe` structured data is the primary extraction strategy.
- A fallback chain is implemented: JSON-LD → Microdata → RDFa → HTML scraping.
- All parsing changes are covered by automated tests against a fixture corpus.

---

## Broad Site Coverage

> **GitHub Issue:** [#2](https://github.com/kalebwbishop/cutthecrap/issues/2)

**As a** home cook who uses many different recipe websites,
**I want** URL parsing to work reliably across all major recipe sites,
**so that** I can trust the app with any recipe link I find.

### Acceptance Criteria

- Parse success rate is ≥ 95% across the top 50 recipe sites by traffic.
- Average parse time is under 3 seconds for non-JS-rendered pages.
- Automated extraction is tested against a corpus from each of the top 50 sites.

---

## Clean Error Handling for Non-Recipe Pages

> **GitHub Issue:** [#3](https://github.com/kalebwbishop/cutthecrap/issues/3)

**As a** user who accidentally pastes a non-recipe URL (blog homepage, 404, video page),
**I want** a clear, friendly error message telling me the link isn't a recipe,
**so that** I'm not confused by blank screens or garbage data.

### Acceptance Criteria

- Non-recipe URLs return a clear, user-friendly error message.
- No partial or garbage data is ever returned — the parser fails cleanly.
- Failed URLs are logged with domain, URL, and failure reason for analysis.

---

## Priority Parsing for Pro Users

> **GitHub Issue:** [#4](https://github.com/kalebwbishop/cutthecrap/issues/4)

**As a** Pro subscriber,
**I want** my recipe URLs to be parsed faster than free-tier requests,
**so that** I experience premium speed as part of the value I'm paying for.

### Acceptance Criteria

- Pro users are routed through a priority parsing queue.
- Free tier parsing remains functional but may queue behind Pro requests during peak load.

---

## Parsing Reliability Monitoring

> **GitHub Issue:** [#5](https://github.com/kalebwbishop/cutthecrap/issues/5)

**As a** member of the engineering/product team,
**I want** a monitoring dashboard and alerts for parsing performance,
**so that** we catch regressions quickly and maintain our reliability promise.

### Acceptance Criteria

- Monitoring dashboard tracks parse success rate, latency, and cost per parse.
- Alerts fire when any top-50 domain success rate drops below 90%.
- Failed URLs are logged with enough context to diagnose and fix issues.
