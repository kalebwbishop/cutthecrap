# Recipe Editing — Title, Notes & Ingredient Cleanup

> **Phase:** 2 — Make the App Sticky  
> **Target release:** v1.1 (July 1, 2026)  
> **Milestone:** Retention release (September 1, 2026)  
> **Tier:** Pro  
> **Priority:** Medium

---

## Summary

Allow Pro users to edit saved recipes: change the title, add personal notes, and clean up ingredient text. Parsed recipes often have imperfect formatting or extra text — giving users the power to fix and personalize them makes the library truly theirs.

---

## Value Proposition

- **For users:** Fix a weirdly parsed title, add "Mom uses 2 cups instead of 1.5," or clean up ingredient text that came through messy. Personal edits make each recipe more useful every time it's cooked.
- **For the business:** Edits deepen investment in the library. Every personal note is a reason to keep the subscription. Editable recipes also compensate for imperfect parsing — reducing the impact of parser errors on user satisfaction.
- **Retention mechanism:** User-generated content (notes, edits) is the strongest switching cost. A user who has annotated 50 recipes will not leave.

---

## Detailed Instructions

### 1. Editable fields

- **Title:** Tap to edit, inline editing.
- **Personal notes:** A free-text notes section at the top or bottom of the recipe (separate from parsed instructions).
- **Ingredients:** Allow editing individual ingredient lines — fix typos, adjust quantities, or add/remove items.
- **Steps/Instructions:** Allow editing individual steps (optional, can be Phase 2.5 if scope is too large).

### 2. Edit UX

- Use inline editing (tap to edit) rather than a separate edit screen for quick fixes.
- Show a visual indicator that a field has been modified (e.g., a small "edited" badge or different text color).
- Auto-save edits with a brief "Saved" confirmation.
- Provide an "undo" or "revert to original" option for each edited field.

### 3. Notes feature

- Each recipe gets a notes section for free-text personal annotations.
- Notes support basic formatting (line breaks at minimum; bold/italic optional).
- Notes are searchable via the recipe search feature.

### 4. Data model

- Store edits as user overrides — preserve the original parsed data separately so it can be reverted.
- Edits sync across devices for Pro users.

### 5. Free tier behavior

- Free users can view recipes but cannot edit titles, notes, or ingredients.
- Show a locked indicator with an upgrade prompt on edit actions.

---

## Acceptance Criteria

- [ ] Pro users can edit recipe titles inline.
- [ ] Pro users can add, edit, and delete personal notes on any saved recipe.
- [ ] Pro users can edit individual ingredient lines.
- [ ] Edits auto-save with a visual "Saved" confirmation.
- [ ] Modified fields show a visual indicator (e.g., "edited" badge).
- [ ] "Revert to original" option is available for each edited field.
- [ ] Original parsed data is preserved separately from user edits.
- [ ] Notes support at least line breaks and are searchable.
- [ ] Edits sync across devices for Pro users.
- [ ] Free users see a locked/upgrade prompt when attempting to edit.
- [ ] Edit functionality works on iOS, Android, and web.
