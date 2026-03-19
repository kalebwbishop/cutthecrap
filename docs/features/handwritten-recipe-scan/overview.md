# Scan Handwritten Recipe (Beta)

> **Phase:** 4 — Social and Household Utility  
> **Target release:** Family/shared beta (February 1, 2027)  
> **Milestone:** Year 1 expansion release (March 19, 2027)  
> **Tier:** Pro  
> **Priority:** Low

---

## Summary

Allow users to photograph handwritten recipe cards and convert them into digital, structured recipes in their library. This is a beta feature targeting the deeply personal use case of preserving family recipes — grandmother's recipe cards, handwritten notes from cooking classes, scribbled modifications.

---

## Value Proposition

- **For users:** Digitize and preserve family recipes that exist only on paper. Never lose a handwritten recipe card again. Turn a box of index cards into a searchable, shareable digital library.
- **For the business:** This is an emotionally powerful feature. Family recipes are deeply personal — digitizing them creates an irreplaceable asset in the user's library, making the app invaluable. It's also highly shareable content (social media posts about digitizing grandma's recipes).
- **Marketing angle:** "Save Grandma's recipes forever" is a compelling story for press, social media, and word-of-mouth.

---

## Detailed Instructions

### 1. Photo capture

- In-app camera mode optimized for recipe cards: flat document detection, auto-crop, brightness adjustment.
- Support uploading existing photos from the camera roll.
- Support multiple photos for front/back of a recipe card or multi-page recipes.

### 2. Handwriting OCR

- Use a handwriting-capable OCR model (e.g., OpenAI vision, Google Cloud Vision, or Azure Computer Vision).
- Handwriting OCR is significantly harder than printed text — accuracy expectations should be set at 80–90% for legible handwriting.
- Illegible sections should be flagged for manual entry rather than silently dropped.

### 3. AI-assisted structuring

- After OCR extracts the raw text, pass it through the AI parsing pipeline to identify:
  - Title (often the top line or header).
  - Ingredients list.
  - Instructions/steps.
  - Servings and times (if present).
- Handle the inherent messiness of handwritten recipes: no standard format, abbreviations ("tsp," "c."), crossed-out text, margin notes.

### 4. Review and correction UI

- Show the original photo alongside the extracted text for side-by-side comparison.
- Highlight low-confidence text sections in a different color.
- Allow the user to edit any extracted field before saving.
- Make the correction flow fast and simple — this is expected to need human review.

### 5. Beta labeling

- Clearly label this feature as "Beta" in the UI.
- Set expectations: "Handwriting recognition works best with clear, legible writing."
- Include a feedback mechanism for users to report poor results.

---

## Acceptance Criteria

- [ ] Pro users can photograph a handwritten recipe using the in-app camera.
- [ ] Users can upload existing photos of handwritten recipes from their camera roll.
- [ ] Multiple photos can be combined for multi-page or front/back recipe cards.
- [ ] Handwriting OCR extracts text with ≥ 80% character accuracy on legible handwriting.
- [ ] AI parsing structures the extracted text into title, ingredients, steps, servings, and times.
- [ ] Review UI shows original photo alongside extracted text for comparison.
- [ ] Low-confidence text sections are highlighted for manual correction.
- [ ] Users can edit all extracted fields before saving.
- [ ] Feature is clearly labeled as "Beta" in the UI.
- [ ] Feedback mechanism is available for users to report issues.
- [ ] Feature works on iOS and Android (camera required); web supports photo upload only.
- [ ] Free users see the feature in a locked state with an upgrade prompt.
