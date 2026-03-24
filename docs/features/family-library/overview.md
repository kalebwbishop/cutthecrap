# Shared Family Library

> **Phase:** 4 — Social and Household Utility  
> **Target release:** Family/shared beta (February 1, 2027)  
> **Milestone:** Year 1 expansion release (March 19, 2027)  
> **Tier:** Family plan ($79.99/year)  
> **Priority:** High

---

## Summary

Allow household members to share a common recipe library. Recipes saved by any family member are accessible to all members of the household. This turns Cut The Crap from an individual tool into a household utility.

---

## Value Proposition

- **For users:** Everyone in the household can access the same recipes. No more texting links back and forth or asking "What was that recipe you made last week?" One shared library for the whole family.
- **For the business:** The family plan ($79.99/year) is a premium tier that increases ARPU. Shared libraries dramatically increase switching costs — if the whole household uses the app, nobody leaves.
- **Retention moat:** Multi-user households are the stickiest subscription segment in consumer apps.

---

## Detailed Instructions

### 1. Household creation

- A Pro or Family plan user can create a "household" from their settings.
- The creator becomes the household admin.
- Invite other members via email or a shareable invite link.
- Up to 5 household members (as defined in the Family plan).

### 2. Shared library

- All household members contribute to and can browse the shared recipe library.
- Recipes saved by any member appear in the shared library.
- Each member retains their personal library as well (shared + personal coexist).
- Indicate who saved each recipe ("Added by Mom," "Added by Dad").

### 3. Permissions

- All members can add, view, and cook from shared recipes.
- Only the recipe saver (or household admin) can edit or delete a shared recipe.
- Household admin can remove members.

### 4. Shared meal planner

- Household meal planner is separate from personal meal planner.
- All members can add/remove recipes from the shared weekly plan.
- Changes sync in real time across all household members.

### 5. Data model

- `households`: id, name, admin_user_id, created_at.
- `household_members`: household_id, user_id, role (admin/member), joined_at.
- `shared_recipes`: household_id, recipe_id, added_by_user_id.

---

## Acceptance Criteria

- [ ] Family plan users can create a household and invite up to 5 members.
- [ ] Members can be invited via email or shareable invite link.
- [ ] Shared recipe library is accessible to all household members.
- [ ] Each member retains a personal library alongside the shared library.
- [ ] Shared recipes show who added them.
- [ ] Only the saver or admin can edit/delete shared recipes.
- [ ] Household admin can remove members.
- [ ] Shared meal planner is visible and editable by all household members.
- [ ] Changes to shared library and meal plan sync in real time.
- [ ] Household is limited to 5 members as defined by the Family plan.
- [ ] Feature works on iOS, Android, and web.
