# Recipe Sharing — Share a Cleaned Recipe Card

> **Phase:** 2 — Make the App Sticky  
> **Target release:** v1.5 (September 1, 2026)  
> **Milestone:** Retention release (September 1, 2026)  
> **Tier:** Free + Pro  
> **Priority:** Medium

---

## Summary

Let users share a beautifully formatted, clean recipe card with friends and family — via link, image, or native share sheet. This is both a user-facing feature and an organic growth mechanism.

---

## Value Proposition

- **For users:** Share a clean, ad-free recipe with anyone — no more sending links to bloated pages. The recipient gets a beautiful card they can read immediately.
- **For the business:** Every shared recipe card is free marketing. Recipients see the Cut The Crap brand and are one tap away from downloading the app. Sharing is the most natural growth loop for a recipe product.
- **Growth lever:** Shared recipe cards include a subtle "Cleaned by Cut The Crap" watermark/link, driving organic installs from people who receive shared recipes.

---

## Detailed Instructions

### 1. Share formats

- **Link share:** Generate a shareable URL that opens a clean, web-rendered recipe card (no auth required to view). The web card includes a "Get the app" CTA.
- **Image share:** Generate a formatted recipe card as an image (PNG) suitable for texting, Instagram stories, or saving to camera roll.
- **Native share sheet:** Use the platform's native share sheet (iOS/Android) to share via Messages, WhatsApp, email, etc.

### 2. Recipe card design

- Clean, minimal layout: title, source attribution, ingredients, and steps.
- Branded with a subtle "Cleaned by Cut The Crap" footer and app icon.
- Dark and light mode versions for image export.
- Optimized for readability on mobile screens.

### 3. Web recipe card page

- Public URL (no auth) that renders the shared recipe.
- SEO-friendly with proper meta tags and Open Graph data (image preview in link shares).
- "Get the app" banner at the top or bottom.
- Does NOT require the recipient to create an account to view.

### 4. Sharing from the app

- Share button on every recipe detail view.
- Tapping share opens a bottom sheet with options: copy link, share as image, share via native sheet.
- Track share events in analytics: share method, recipe domain, user tier.

### 5. Limits

- Free and Pro users can both share.
- Optional: Free users can share up to N recipes per month; Pro users have unlimited sharing.

---

## Acceptance Criteria

- [ ] Share button is present on every recipe detail view.
- [ ] Users can share a recipe via link, image, or native share sheet.
- [ ] Shared link opens a public, no-auth-required web recipe card.
- [ ] Web recipe card is clean, branded, and includes a "Get the app" CTA.
- [ ] Image export produces a formatted recipe card (PNG) suitable for messaging and social.
- [ ] Recipe card includes "Cleaned by Cut The Crap" branding.
- [ ] Open Graph meta tags produce a rich preview when the link is shared in messaging apps.
- [ ] Share events are tracked in analytics (method, recipe domain, user tier).
- [ ] Sharing works on iOS, Android, and web.
- [ ] Shared recipe card renders correctly in both dark and light mode (image export).
