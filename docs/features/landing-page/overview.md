# Landing Page with Waitlist & Referral Capture

> **Phase:** 1 — Stabilize and Ship Paid v1  
> **Target release:** April 15, 2026 (before closed beta)  
> **Milestone:** Public v1 (May 15, 2026)  
> **Tier:** Public / marketing  
> **Priority:** High

---

## Summary

Build a public-facing landing page that clearly communicates the product value, captures waitlist signups, and includes a referral mechanism for organic growth. This page is the front door for all marketing and acquisition efforts leading up to the public v1 launch.

---

## Value Proposition

- **For users:** Understand what Cut The Crap does in 5 seconds. Sign up to be first in line.
- **For the business:** Build a pre-launch audience, validate messaging, and create a referral loop that compounds before the app is even public.
- **Growth lever:** Waitlist referrals are the cheapest acquisition channel. Each person who shares their link brings in warm leads at zero cost.

---

## Detailed Instructions

### 1. Landing page design and content

- **Hero section:** One-line value prop ("Paste a recipe URL, get just the recipe."), a URL input demo or screenshot, and a primary CTA to join the waitlist.
- **How it works:** 3-step visual (paste URL → we clean it → you get the recipe).
- **Features preview:** Highlight free tier (unlimited parsing, 5 saved recipes) and Pro tier (unlimited saves, folders, search, meal planning).
- **Social proof:** Placeholder for testimonials, beta user count, or press mentions as they come.
- **Pricing teaser:** Show the 3-tier pricing structure.
- **Footer:** Links to privacy policy, terms, support email, and social accounts.

### 2. Waitlist signup flow

- Email capture form with a clear CTA ("Join the waitlist" or "Get early access").
- On submit, show a confirmation with the user's waitlist position and a unique referral link.
- Send a confirmation email with the referral link and a brief product summary.

### 3. Referral mechanism

- Each waitlist signup generates a unique referral link.
- When someone signs up via a referral link, both the referrer and referee get credit.
- Referral rewards (to be defined, but options include: move up the waitlist, early access, temporary Pro trial at launch).
- Display a referral leaderboard or progress indicator on the user's waitlist confirmation page.

### 4. Technical implementation

- Can be a simple static site (Next.js, Astro, or similar) or a page within the existing Expo web build.
- Waitlist data stored in the database or a lightweight tool (e.g., Loops, Mailchimp, or custom table).
- SEO basics: meta tags, Open Graph tags, favicon, sitemap.
- Mobile-responsive.

### 5. Analytics

- Track: page visits, waitlist signups, referral link shares, referral conversions.
- Attribute signups to source (organic, referral, social, paid).

---

## Acceptance Criteria

- [ ] Landing page is live at the production domain.
- [ ] Hero section clearly communicates the value prop in one line.
- [ ] "How it works" section explains the product in 3 steps.
- [ ] Pricing teaser shows Free, Pro Monthly, and Pro Annual tiers.
- [ ] Waitlist signup form captures email and confirms with a referral link.
- [ ] Confirmation email is sent with the referral link.
- [ ] Referral links track and credit both referrer and referee.
- [ ] Page is mobile-responsive and scores ≥ 90 on Lighthouse performance.
- [ ] SEO meta tags, Open Graph tags, and sitemap are in place.
- [ ] Analytics track page visits, signups, referral shares, and referral conversions.
