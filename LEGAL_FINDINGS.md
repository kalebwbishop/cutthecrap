# Legal Analysis: Cut The Crap Recipe Extraction App

## Executive Summary

**Cut The Crap** is a recipe extraction tool that fetches recipe web pages, strips non-recipe content, and uses OpenAI to rewrite recipes in new words. The app operates in a **legal gray area** that is broadly defensible but carries real risks. The strongest legal protections come from (1) the well-established principle that recipe ingredients and basic instructions are not copyrightable, (2) the AI-driven rewriting that creates transformative output, (3) the fact that the app only scrapes publicly available content, (4) `robots.txt` compliance with a caching layer, and (5) an honest, transparent User-Agent. The primary risks stem from (1) potential violation of individual website terms of service, (2) the commercial nature of the app (paid tier), and (3) the server-side fetching model that allows users to bypass ad-supported pages. No comparable recipe extraction app (e.g., Paprika, CopyMeThat) has faced a successful lawsuit, but the legal landscape—particularly around AI and scraping—is evolving rapidly.

**This is not legal advice.** This report is a technical analysis of legal risk areas. Consult a qualified attorney for formal guidance.

---

## 1. Copyright Law and Recipes

### What's Protected (and What Isn't)

Under U.S. copyright law, **a mere listing of ingredients is not copyrightable**. The U.S. Copyright Office explicitly states: "A mere listing of ingredients is not protected under copyright law. However, where a recipe or formula is accompanied by substantial literary expression in the form of an explanation or directions, or when there is a collection of recipes as in a cookbook, there may be a basis for copyright protection."[^1]

This means:

| Element | Copyrightable? | Notes |
|---------|---------------|-------|
| Ingredient lists | **No** | Considered factual/functional data |
| Basic cooking instructions | **Generally no** | Procedures and processes are excluded by 17 U.S.C. § 102(b) |
| Creative descriptions, stories, commentary | **Yes** | "Substantial literary expression" is protected |
| Photographs | **Yes** | Original photographs are copyrightable works |
| Unique arrangement/compilation of a cookbook | **Yes** | Creative selection and arrangement can be protected |

### How This Applies to Cut The Crap

Cut The Crap extracts the factual components of a recipe—ingredients, quantities, temperatures, cooking times, and step-by-step instructions—which are the elements **least protected** by copyright. The app explicitly strips out the creative/literary elements (life stories, ad copy, SEO filler) that **are** most likely to be protected[^2]. This is architecturally favorable from a copyright perspective.

Crucially, the system prompt instructs OpenAI to **"Rewrite all text in your own words. Do not copy verbatim from the source. Keep the same meaning, quantities, temperatures, and technique but rephrase naturally."**[^3] This applies to both the raw text path and the structured data path—both go through the OpenAI API with the same rewriting instruction[^4].

---

## 2. Fair Use Analysis (Four Factors)

If a copyright holder did challenge Cut The Crap, the defense would rely on the **fair use doctrine** (17 U.S.C. § 107). Here's how the four factors likely apply:

### Factor 1: Purpose and Character of the Use

**Leans favorable, with caveats.**

The app's use is arguably **transformative**: it takes a full web page with copyrighted creative expression (stories, photos, commentary) and produces a distilled, AI-rewritten set of factual cooking instructions. The purpose is different from the original—personal cooking utility vs. content publishing/advertising revenue[^5].

However, the app is **commercial** (it has a paid "Cut The Crap Pro" subscription tier)[^6], which traditionally weighs against fair use. That said, post-*Campbell v. Acuff-Rose* (1994), commercial use does not automatically defeat fair use if the work is sufficiently transformative[^7].

### Factor 2: Nature of the Copyrighted Work

**Strongly favorable.**

Recipes are **functional/factual works** with minimal creative expression in their core content (ingredients and instructions). Fair use is more readily available for factual works than for highly creative ones like novels or films[^8].

### Factor 3: Amount and Substantiality of the Portion Used

**Favorable.**

The app uses the factual "heart" of the recipe (ingredients and steps) but deliberately strips and excludes the creative expression (stories, commentary, photos). While it does use the entire functional portion, courts have allowed this when the purpose requires it—you can't summarize a recipe without including its ingredients[^9].

### Factor 4: Effect on the Potential Market

**This is the most contested factor.**

- **Argument for fair use:** Cut The Crap does not republish the original content. It stores a link back to the source URL[^10]. Users can tap to visit the original page. The app doesn't host ads or compete with recipe websites as a content platform.
- **Argument against fair use:** Recipe websites derive revenue from ad impressions on their pages. If users never visit the original page (because the app fetches the content server-side), this directly harms the website's ad revenue model. The app effectively allows users to bypass the website entirely, reducing page views and therefore ad revenue. This "market substitution" effect could weigh against fair use.

### Fair Use Summary

| Factor | Assessment | Direction |
|--------|-----------|-----------|
| Purpose & Character | Transformative (AI rewriting), but commercial | Slightly favorable |
| Nature of Work | Factual/functional | Strongly favorable |
| Amount Used | Full factual content, no creative expression | Favorable |
| Market Effect | Bypasses ad-supported pages | Slightly unfavorable |

**Overall:** A fair use defense is plausible but not certain, particularly because of the market harm factor and the commercial nature of the app.

---

## 3. Web Scraping Legality

### Computer Fraud and Abuse Act (CFAA)

Under the landmark **hiQ Labs v. LinkedIn** decision (Ninth Circuit, reaffirmed 2022), scraping **publicly available** data from websites does not constitute "unauthorized access" under the CFAA[^12]. The Supreme Court's *Van Buren v. United States* (2021) further narrowed the CFAA to focus on bypassing authentication gates, not violating terms of service[^13].

Cut The Crap only scrapes publicly available recipe pages—no login bypass, no paywall circumvention, no CAPTCHA solving. **CFAA liability is very unlikely.**

### robots.txt Compliance

The app checks and respects `robots.txt` disallow directives before fetching any page[^14]. The implementation uses Python's `urllib.robotparser.RobotFileParser` with a 1-hour cache per domain to avoid re-fetching on every request[^14a]. If a site's `robots.txt` disallows the `CutTheCrap` user-agent, the request is blocked with HTTP 403[^14b]. If `robots.txt` cannot be fetched (404, timeout, etc.), the app defaults to allowing the request — matching standard crawler behavior.

This compliance:

- Demonstrates **good faith** in respecting site owner directives
- Satisfies the EU Copyright Directive's data-mining opt-out mechanism[^16]
- Reduces civil liability risk by showing the app respects site-level access controls

### Transparent User-Agent

The app identifies itself with an honest, transparent User-Agent[^17]:

```python
"CutTheCrap/1.0 (Recipe Extraction; +https://cutthecrap.app/bot)"
```

This clearly identifies the app as an automated tool and includes a URL for site operators to learn more. This transparency:

- Demonstrates **good faith** and distinguishes the app from malicious scrapers
- Allows site operators to specifically target `CutTheCrap` in their `robots.txt` if they wish to opt out
- Avoids any appearance of deceptive or circumventive behavior

---

## 4. Terms of Service Violations

### Third-Party Website ToS

Most major recipe websites (AllRecipes, Food Network, NYT Cooking, etc.) include terms of service that prohibit automated scraping and extraction. While the CFAA doesn't criminalize ToS violations for public data, **breach of contract** claims can still be brought as civil actions[^18].

The hiQ v. LinkedIn saga illustrates this risk: even after winning on CFAA grounds, hiQ ultimately settled for $500,000 due to ToS violations (including creating fake accounts)[^19]. A recipe website could similarly pursue civil claims against Cut The Crap for ToS violations.

**Risk level:** Low for a small-scale app; increases if the app gains significant user traction and a major recipe publisher takes notice.

### OpenAI Terms of Service

Cut The Crap sends scraped third-party content to OpenAI's API for processing. The critical question is whether this use aligns with OpenAI's terms. Below is a detailed analysis based on the OpenAI Terms of Use (effective January 1, 2026) and the OpenAI Services Agreement.

#### The Key Provision

The Terms of Use state:

> "You represent and warrant that you have all rights, licenses, and permissions needed to provide Input to our Services."[^20]

And under "What you cannot do":

> "Use our Services in a way that infringes, misappropriates or violates anyone's rights."[^20a]

#### Analysis: Does Cut The Crap's Use Comply?

**What the app sends as Input:** The app fetches publicly accessible recipe web pages, extracts the visible text or structured data (JSON-LD), and sends that extracted content to OpenAI's API. The API then returns a rephrased, structured recipe.

**Arguments that this use aligns with OpenAI's terms:**

1. **Recipe facts are not copyrightable.** As established in Section 1 of this report, ingredient lists and basic cooking instructions are not protected by copyright under U.S. law. The "rights, licenses, and permissions" warranty is primarily concerned with copyrighted material, trade secrets, and personal data. Factual information—quantities, temperatures, cooking times, technique descriptions—does not require a license to use because no one owns those facts.

2. **The app strips protected creative expression before sending Input.** The extraction pipeline deliberately removes the copyrightable elements (life stories, creative descriptions, photographs, ad copy, SEO filler) and sends only the factual recipe content. This means the Input itself is composed primarily of uncopyrightable facts, not protected creative expression[^2].

3. **Publicly available information does not require a license to read and process.** Under *hiQ Labs v. LinkedIn* and *Van Buren v. United States*, accessing publicly available content does not constitute unauthorized access[^12][^13]. The app does not bypass paywalls, authentication gates, or CAPTCHAs. Reading public web content and sending it to an API for analysis is functionally equivalent to a user reading a web page and asking ChatGPT about it.

4. **The use is transformative, not redistributive.** OpenAI's terms prohibit using services in ways that infringe others' rights. The app uses the API to *transform* factual content into a new expression—a rephrased, structured recipe—rather than to reproduce copyrighted material. The system prompt explicitly instructs the model to "Rewrite all text in your own words. Do not copy verbatim from the source."[^3] The Output is a derivative work authored by the AI, not a copy of the Input.

5. **Structured data extraction further reduces risk.** When a recipe site provides JSON-LD structured data (Schema.org `Recipe` markup), the app preferentially uses that machine-readable format. This data is *explicitly published by the site for automated consumption*—search engines, voice assistants, and recipe apps all consume it. Sending this structured data to OpenAI is fully consistent with the site's own publication intent.

6. **The use case is indistinguishable from common ChatGPT usage.** Millions of users paste web content into ChatGPT daily and ask it to summarize, rephrase, or extract information. Cut The Crap automates this same workflow via the API. OpenAI has not indicated that this common use pattern violates their terms, and their platform is designed to process exactly this kind of request.

**Remaining areas of ambiguity:**

1. **The "rights, licenses, and permissions" warranty is broad.** Strictly interpreted, one could argue that website Terms of Service that prohibit automated extraction constitute a contractual restriction that the user lacks "permission" to overcome. However, this interpretation would make virtually all web summarization tools—including ChatGPT's own browse feature—non-compliant. Courts and OpenAI have not adopted this expansive reading.

2. **Scale matters.** Processing a single recipe at a user's request is different from bulk-scraping entire recipe databases through the API. Cut The Crap's rate limit of 10 requests/minute per IP[^25] and its one-at-a-time, user-initiated model keeps the use within individual-use boundaries.

3. **OpenAI's terms are evolving.** The AI/copyright landscape is in flux, with cases like *NYT v. OpenAI* and *Getty v. Stability AI* potentially establishing new precedents. Future updates to OpenAI's terms could add restrictions on processing third-party web content.

#### Conclusion

**Cut The Crap's use of the OpenAI API likely aligns with current OpenAI usage policies.** The app sends primarily uncopyrightable factual content (recipe ingredients and instructions) extracted from publicly accessible web pages, and uses the API to generate transformative output (rephrased recipes). This is functionally identical to how millions of users interact with ChatGPT daily. The mitigations already in place—stripping creative expression, rewriting instructions, source attribution, rate limiting, and robots.txt compliance—further strengthen compliance. No provision in the current OpenAI Terms of Use or Usage Policies specifically prohibits this use pattern.

**Confidence: Medium-High.** The analysis is sound under current terms, but OpenAI's policies are subject to change, and the broader AI/copyright legal landscape remains unsettled.

[^20a]: [OpenAI Terms of Use — "What you cannot do"](https://openai.com/policies/row-terms-of-use/)

---

## 5. Comparison with Similar Tools

Several established recipe extraction apps operate in the same space:

| App | Approach | Legal Issues? |
|-----|----------|--------------|
| **Paprika Recipe Manager** | User-initiated browser import, personal use focus | No known lawsuits[^21] |
| **CopyMeThat** | Browser extension, user-initiated | No known lawsuits |
| **Recipe Keeper** | Manual/URL import | No known lawsuits |
| **Saffron** | Browser extension, personal use | No known lawsuits |

No recipe extraction app has faced a successful copyright or scraping lawsuit. The key pattern: these apps frame themselves as **personal use tools** where the user initiates the extraction, which strengthens the personal/educational fair use argument.

**Cut The Crap differs** in that it performs server-side scraping (the user never visits the page) and has a commercial paid tier. This positions it slightly more aggressively than Paprika-style tools, though the app's `robots.txt` compliance, transparent User-Agent, and AI-driven rewriting provide mitigations those tools lack.

---

## 6. The App's Existing Legal Mitigations

The codebase already contains several legal mitigations:

### Strengths

1. **AI Rewriting Instruction:** The system prompt explicitly requires rephrasing, not verbatim copying[^3]. This is the strongest technical mitigation.

2. **Source Attribution:** The `source_url` is stored with every recipe and displayed as a tappable link in the UI[^10]. Users can tap to visit the original page.

3. **Terms of Service (Section 6):** "Recipes extracted through the App remain the intellectual property of their respective authors and websites"[^22]—an explicit acknowledgment of third-party IP.

4. **ToS (Section 5):** Prohibits users from "scraping or redistributing extracted content in bulk"[^23]—shifting bulk redistribution liability onto users.

5. **Privacy Policy:** "We do not collect or store the full content of third-party websites"[^24]—only the extracted recipe data is persisted.

6. **Rate Limiting:** 10 requests/minute per IP[^25] limits abuse potential.

7. **SSRF Protection:** Blocks private/internal IP ranges[^26], showing security awareness.

8. **robots.txt Compliance:** The scraper checks and respects `robots.txt` disallow directives before fetching any page, with a 1-hour cache per domain[^14]. This demonstrates good faith and satisfies the EU Copyright Directive's opt-out mechanism.

9. **Transparent User-Agent:** Requests identify as `CutTheCrap/1.0 (Recipe Extraction; +https://cutthecrap.app/bot)`[^17]—an honest identifier that allows site operators to block the app via `robots.txt` if desired.

10. **Open-Source License:** The repository includes an MIT License[^28], clarifying distribution rights.

11. **Structured Data Preference:** When available, the app uses JSON-LD/Microdata/RDFa Recipe markup that sites explicitly publish for machine consumption[^29], further reducing the argument that scraping is unwelcome.

12. **No Outbound Recipe Sharing:** The app has no mechanism for users to share or redistribute extracted recipes to other users. Social features are limited to a friends list with no recipe sharing capability.

### Weaknesses

1. **No formal DMCA takedown procedure** — The README references a DMCA process, but the Terms of Service (Section 10) only says "please contact us through the App or our website" without a specific email address, response timeline, or formal procedure. No DMCA agent is registered with the U.S. Copyright Office.
2. **Server-side fetching** — The user never visits the original page, which is the strongest argument for market harm under Fair Use Factor 4.
3. **Commercial nature** — The "Cut The Crap Pro" paid tier weighs against fair use, though post-*Campbell* this is not dispositive.
4. **AI rewriting fidelity is untested** — Simple instructions like "preheat oven to 350°F" may produce near-identical output. The degree of actual transformation varies by recipe complexity and has not been systematically audited.

---

## 7. Recommendations for Risk Reduction

These are practical steps ordered by impact and ease of implementation:

### High Priority

1. **Formalize DMCA takedown process** — The README acknowledges a DMCA process, but the Terms of Service lacks a specific contact email address (e.g., `dmca@cutthecrap.app`), a response timeline (e.g., "We will respond within 10 business days"), and a link to the procedure. Consider registering a DMCA agent with the U.S. Copyright Office for full safe harbor protection under 17 U.S.C. § 512(c)(2).

### Medium Priority

2. **Consider client-side fetching** — If the user's browser fetches the page (similar to Paprika's approach), this strengthens the "user-initiated personal use" argument. Server-side fetching is more legally exposed.

3. **Audit AI output fidelity** — Run a sample of 50+ recipes through the extraction pipeline and measure the textual similarity between source instructions and AI output. This would provide concrete evidence that the rewriting instruction produces genuinely transformative output and strengthen the fair use defense.

### Previously Addressed

The following recommendations from the original analysis have been implemented:

- ~~**Add `robots.txt` checking**~~ — ✅ Implemented. Full compliance with caching (`backend/app/services/robots_service.py`).
- ~~**Use an honest User-Agent**~~ — ✅ Implemented. Transparent `CutTheCrap/1.0` identifier.
- ~~**Add a `robots.txt` caching layer**~~ — ✅ Implemented. 1-hour TTL per domain.
- ~~**Add a LICENSE file**~~ — ✅ Added. MIT License.
- ~~**Review OpenAI API terms**~~ — ✅ Reviewed. See expanded analysis in Section 4.

---

## 8. Jurisdictional Notes

- **United States:** The analysis above is primarily U.S.-focused (CFAA, fair use under 17 U.S.C. § 107). This is the most favorable jurisdiction for this type of tool.
- **European Union:** The EU Copyright Directive (Article 4) allows text and data mining for research purposes, with an opt-out mechanism via `robots.txt`. Commercial scraping is more restricted. The EU AI Act may also impose requirements if AI is used to process copyrighted content.
- **Other jurisdictions:** Australia, Canada, and the UK have their own copyright frameworks with different fair dealing provisions. A global app should consider multi-jurisdictional compliance.

---

## Confidence Assessment

| Claim | Confidence | Basis |
|-------|-----------|-------|
| Ingredient lists are not copyrightable | **High** | U.S. Copyright Office, settled case law |
| CFAA does not apply to public scraping | **High** | hiQ v. LinkedIn, Van Buren v. United States |
| Fair use defense is plausible | **Medium-High** | Strengthened by robots.txt compliance, honest User-Agent, and absence of sharing features; market harm factor remains uncertain |
| No comparable app has been sued successfully | **Medium-High** | No public records found; absence of evidence ≠ evidence of absence |
| robots.txt compliance reduces risk | **High** | Implemented with caching; demonstrates good faith and satisfies EU opt-out |
| Transparent User-Agent demonstrates good faith | **High** | Implemented; allows site operators to opt out via robots.txt |
| ToS violations can lead to civil liability | **High** | hiQ settlement, general contract law |
| The AI rewriting instruction is effective | **Medium** | Depends on actual output quality; AI may still produce near-verbatim text for simple instructions |
| OpenAI API use aligns with their terms | **Medium-High** | Factual content, transformative use, publicly available data; terms are evolving |

### Key Uncertainties

- **AI-generated output fidelity:** The "rewrite in your own words" instruction is effective in principle, but GPT-4o-mini's actual output for simple instructions like "preheat oven to 350°F" may be near-identical to the original. The degree of actual transformation varies by recipe complexity and is untested.
- **Evolving AI/copyright landscape:** Multiple lawsuits (NYT v. OpenAI, Getty v. Stability AI, etc.) are reshaping how courts view AI and copyrighted content. New precedents could affect this analysis.
- **Scale matters:** The legal risk profile changes significantly if the app grows to millions of users vs. a small personal project.

---

## Footnotes

[^1]: [U.S. Copyright Office FAQ — What Does Copyright Protect?](https://www.copyright.gov/help/faq/faq-protect.html)
[^2]: `backend/app/services/recipe_service.py:61` — "Clean up any ad copy, SEO filler, or life-story content — just the recipe facts."
[^3]: `backend/app/services/recipe_service.py:62-63` — "IMPORTANT: Rewrite all text in your own words. Do not copy verbatim from the source."
[^4]: `backend/app/routes/chatgpt.py:93-107` — Both structured data (serialized as JSON) and raw text are sent through `call_openai_chat()` with the same `RECIPE_SYSTEM_PROMPT`.
[^5]: [Stanford Copyright & Fair Use — Measuring Fair Use: The Four Factors](https://fairuse.stanford.edu/overview/fair-use/four-factors/)
[^6]: The app uses react-native-iap (StoreKit / Google Play Billing) and Stripe for in-app purchases with a "pro" entitlement key, managed by a custom Python backend entitlement service.
[^7]: [Transformative Fair Use Explained — Lawyer Monthly](https://www.lawyer-monthly.com/2025/08/transformative-fair-use-us-copyright-law/); *Campbell v. Acuff-Rose Music, Inc.*, 510 U.S. 569 (1994).
[^8]: [BYU Copyright — The Meaning of the Four Fair Use Factors](https://copyright.byu.edu/the-meaning-of-the-four-fair-use-factors)
[^9]: [Copyright Protection in Recipes — CopyrightLaws.com](https://www.copyrightlaws.com/copyright-protection-recipes/)
[^10]: `frontend/src/components/RecipeCard.tsx:60-68` — Source URL displayed as a tappable link; `database/schemas/public_schema.sql:52` — `source_url` stored in the `saved_recipes` table.
[^12]: [hiQ vs LinkedIn: CFAA Ruling and Web Scraping Law — LegalClarity](https://legalclarity.org/hiq-vs-linkedin-the-final-ruling-on-public-data-scraping/)
[^13]: *Van Buren v. United States*, 593 U.S. 374 (2021).
[^14]: `backend/app/services/robots_service.py` — Full robots.txt compliance service using `urllib.robotparser.RobotFileParser`; `backend/app/services/recipe_service.py:342-350` — robots.txt check integrated into `fetch_and_extract()`.
[^14a]: `backend/app/services/robots_service.py:19` — `_CACHE_TTL_SECONDS = 3600` (1-hour cache per domain).
[^14b]: `backend/app/services/recipe_service.py:346-350` — Returns HTTP 403 with "This URL is blocked by the site's robots.txt policy." when disallowed.
[^15]: [Understanding Robots.txt and Legal Considerations in Web Scraping](https://www.datawebot.com/learn/robots-txt-legal-considerations-web-scraping)
[^16]: [robots.txt in 2026: From Courtesy to Legal Requirement](https://dataresearchtools.com/robots-txt-2026-courtesy-to-legal-requirement/)
[^17]: `backend/app/services/recipe_service.py:27` — User-Agent header: `CutTheCrap/1.0 (Recipe Extraction; +https://cutthecrap.app/bot)`.
[^18]: [hiQ and LinkedIn Reach Settlement — National Law Review](https://natlawreview.com/article/hiq-and-linkedin-reach-proposed-settlement-landmark-scraping-case)
[^19]: Ibid. — hiQ agreed to pay $500,000, delete all scraped data, and cease scraping.
[^20]: [OpenAI Usage Policies](https://openai.com/policies/usage-policies/)
[^21]: [Paprika Recipe Manager](https://www.paprikaapp.com/) — No public lawsuit records found. [HowToGeek — Paprika review](https://www.howtogeek.com/finally-paid-for-the-paprika-app-regret-not-doing-it-sooner/) discusses the tool positively with no legal concerns noted.
[^22]: `frontend/src/screens/TermsScreen.tsx:34` — Section 6: Intellectual Property.
[^23]: `frontend/src/screens/TermsScreen.tsx:30` — Section 5: Acceptable Use.
[^24]: `frontend/src/screens/PrivacyScreen.tsx:14` — Section 1: Information We Collect.
[^25]: `backend/app/routes/chatgpt.py:54,75` — `@limiter.limit("10/minute")` on both endpoints.
[^26]: `backend/app/services/recipe_service.py:259-289` — SSRF protection blocking private/reserved IPs.
[^27]: The app does not currently include a clipboard copy/share feature that outputs recipe text.
[^28]: `LICENSE` (repository root) — MIT License, Copyright (c) 2026 Kaleb Bishop.
[^29]: `backend/app/services/structured_data.py` — JSON-LD/Microdata/RDFa extraction for Schema.org Recipe markup.
