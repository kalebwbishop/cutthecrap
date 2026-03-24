# Multi-Format Import — Screenshots & Pasted Text

> **Phase:** 4 — Social and Household Utility  
> **Target release:** Family/shared beta (February 1, 2027)  
> **Milestone:** Year 1 expansion release (March 19, 2027)  
> **Tier:** Pro  
> **Priority:** Medium

---

## Summary

Expand recipe import beyond URLs to support pasting plain text recipes and uploading screenshots of recipes. Many recipes live in text messages, social media posts, cookbooks, and photos — not just web pages. This feature meets users where their recipes actually are.

---

## Value Proposition

- **For users:** Import recipes from anywhere — not just websites. Paste a recipe from a text message, upload a screenshot from Instagram, or copy-paste from a PDF. One library for all your recipes, regardless of source.
- **For the business:** Expanding import methods widens the addressable use case. Users who can import recipes from any source build larger libraries faster, which increases retention and Pro value.
- **Competitive differentiation:** Most recipe apps only support URL import. Multi-format import is a meaningful differentiator.

---

## Detailed Instructions

### 1. Pasted text import

- On the main parse screen, add a "Paste text" option alongside the URL input.
- User pastes or types raw recipe text into a text area.
- Backend sends the text to OpenAI to extract structured recipe data (title, ingredients, steps, times, servings).
- Display the parsed result for review before saving.

### 2. Screenshot / image import

- Add an "Upload image" or "Take photo" option.
- Use OCR (optical character recognition) to extract text from the image.
- Pass the extracted text through the same AI parsing pipeline as pasted text.
- Support common image formats: JPEG, PNG, HEIC.

### 3. Review and edit before saving

- After parsing text or an image, show the extracted recipe for user review.
- Allow the user to edit any field (title, ingredients, steps, etc.) before saving.
- This compensates for imperfect OCR or AI extraction.

### 4. Source attribution

- Recipes imported from text or images are labeled "Imported from text" or "Imported from photo" instead of a source URL.
- Optionally allow the user to add a source note (e.g., "Grandma's recipe" or "From @foodblogger on Instagram").

### 5. Cost and rate management

- Text and image parsing use the OpenAI API, which has per-call costs.
- Rate limit: Pro users get a reasonable monthly allowance (e.g., 50 text/image imports per month).
- Track usage and alert when approaching the limit.

---

## Acceptance Criteria

- [ ] Pro users can paste plain text and parse it into a structured recipe.
- [ ] Pro users can upload an image (JPEG, PNG, HEIC) and parse it into a structured recipe.
- [ ] OCR correctly extracts text from recipe screenshots with ≥ 90% character accuracy on clean images.
- [ ] AI parsing extracts title, ingredients, steps, times, and servings from text/image input.
- [ ] Parsed result is shown for user review and editing before saving.
- [ ] Source attribution shows "Imported from text" or "Imported from photo."
- [ ] Users can add a custom source note.
- [ ] Monthly import limit is enforced (e.g., 50/month for Pro).
- [ ] Usage tracking alerts users when approaching the limit.
- [ ] Feature works on iOS, Android, and web.
- [ ] Free users see the import options in a locked state with an upgrade prompt.
