# Creator Pages & Public Collections

> **Phase:** 4 — Social and Household Utility  
> **Target release:** Year 1 expansion release (March 19, 2027)  
> **Milestone:** Year 1 expansion release (March 19, 2027)  
> **Tier:** Pro  
> **Priority:** Medium

---

## Summary

Allow Pro users to create public-facing profile pages that showcase their curated recipe collections. A creator page is a shareable link with a user's name, bio, and their published collections — turning power users into ambassadors and giving the product a social/discovery layer.

---

## Value Proposition

- **For users:** Show off your curated recipe collections. Share a single link with your followers, family, or friends that contains all your best recipes organized by theme.
- **For the business:** Creator pages generate SEO-indexed content, organic backlinks, and social sharing. They turn users into distribution channels. Popular creators attract new signups.
- **Platform flywheel:** Creators attract audiences → audiences sign up → some become creators → repeat.

---

## Detailed Instructions

### 1. Profile page

- Pro users can opt in to a public profile at `cutthecrap.app/u/{username}`.
- Profile includes: display name, bio, avatar, and list of published collections.
- Profile is optional — users must explicitly publish it.

### 2. Public collections

- Users can mark any of their folders/collections as "public."
- Public collections are viewable by anyone (no auth required).
- Each collection has its own shareable URL: `cutthecrap.app/u/{username}/{collection-slug}`.
- Public collection pages show: title, description, cover image, and list of recipes.

### 3. Recipe viewing

- Recipes within public collections are viewable by anyone.
- Viewers see the clean recipe card (title, ingredients, steps, times).
- Viewers are prompted to "Save to your library" (which requires sign-up) and "Get the app."

### 4. Discovery (stretch goal)

- A "Discover" or "Explore creators" section in the app.
- Featured creators or trending collections on the home screen.
- Search public collections by keyword.

### 5. Moderation

- Implement basic content moderation for public profiles and collection descriptions.
- Allow users to report inappropriate content.
- Reserve the right to remove public profiles that violate terms.

---

## Acceptance Criteria

- [ ] Pro users can create a public profile page with display name, bio, and avatar.
- [ ] Profile URL follows the format `cutthecrap.app/u/{username}`.
- [ ] Users can publish folders/collections as public.
- [ ] Public collections have shareable URLs and are viewable without auth.
- [ ] Recipes in public collections display as clean recipe cards.
- [ ] Viewers see "Save to your library" and "Get the app" CTAs.
- [ ] Profiles are opt-in — users must explicitly publish.
- [ ] Public pages are SEO-indexed with proper meta tags and Open Graph data.
- [ ] Basic content moderation and reporting are in place.
- [ ] Feature works on web (primary), with in-app deep links for iOS and Android.
- [ ] Free users see the creator page feature as a Pro upgrade incentive.
