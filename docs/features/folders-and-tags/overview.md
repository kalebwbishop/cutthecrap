# Folders & Tags for Saved Recipes

> **Phase:** 2 — Make the App Sticky  
> **Target release:** v1.1 (July 1, 2026)  
> **Milestone:** Retention release (September 1, 2026)  
> **Tier:** Pro  
> **Priority:** High

---

## Summary

Allow Pro users to organize their saved recipes into folders and tag them with custom labels. This transforms the saved recipe list from a flat, chronological dump into a personal, organized cookbook.

---

## Value Proposition

- **For users:** Find any recipe instantly by browsing folders ("Weeknight Dinners," "Holiday Baking," "Kid-Friendly") or filtering by tags ("vegetarian," "under 30 min," "meal prep"). Organization turns a pile of links into a personal system.
- **For the business:** Organization is a primary retention driver. The more a user invests in curating their library, the higher the switching cost. Folders and tags also strengthen the Pro value proposition — this is a feature free users will want.
- **Conversion lever:** Folders and tags are gated to Pro. Free users who accumulate more than 5 recipes (and upgrade) will immediately want to organize them.

---

## Detailed Instructions

### 1. Folders

- Users can create, rename, and delete folders.
- A recipe can belong to one or more folders (many-to-many).
- Provide a default "Uncategorized" or "All Recipes" view.
- Folder list appears in a sidebar or tab on the saved recipes screen.
- Drag-and-drop or long-press to move recipes between folders.
- Empty folders can be deleted; folders with recipes prompt for confirmation.

### 2. Tags

- Users can add custom text tags to any saved recipe (e.g., "quick," "vegan," "date night").
- Auto-suggest previously used tags as the user types.
- Filter the recipe list by one or more tags.
- Tags are displayed as chips/badges on recipe cards in the list view.

### 3. Batch operations

- Select multiple recipes to move to a folder or apply/remove tags in bulk.
- "Select all" option for batch operations.

### 4. Backend and data model

- Add `folders` and `recipe_tags` tables (or equivalent) with appropriate foreign keys.
- Ensure folder/tag data syncs across devices for Pro users.
- Migration must be non-destructive — no existing saved recipe data is lost.

### 5. Free tier behavior

- Free users see the folders/tags UI in a locked state with an upgrade prompt.
- If a user downgrades from Pro to Free, their folders and tags are preserved but read-only (they can still view but not create/edit).

---

## Acceptance Criteria

- [ ] Pro users can create, rename, and delete folders.
- [ ] Recipes can be added to one or more folders.
- [ ] Folder list is visible in the saved recipes screen navigation.
- [ ] Users can move recipes between folders via drag-and-drop or menu action.
- [ ] Pro users can add, edit, and remove custom tags on any saved recipe.
- [ ] Tag auto-suggest works based on previously used tags.
- [ ] Recipe list can be filtered by one or more tags.
- [ ] Tags appear as chips/badges on recipe cards in list view.
- [ ] Batch select and move/tag operations work for multiple recipes.
- [ ] Folder and tag data syncs across devices.
- [ ] Free users see a locked/upgrade prompt when attempting to use folders or tags.
- [ ] Downgraded users retain read-only access to existing folders and tags.
- [ ] Database migration is non-destructive.
