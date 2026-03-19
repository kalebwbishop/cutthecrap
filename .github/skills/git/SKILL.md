---
name: git
description: >
  Create new feature branches off the dev branch. Pulls the latest dev first,
  then creates and checks out a new branch. Use for topics related to
  git branch, new branch, feature branch, branching off dev.
---

# Git Branching Skill

> Create new branches off `dev` with the latest upstream changes.

## IMPORTANT: Always branch when working on GitHub issues

When starting work on any GitHub issue, **always** create a new branch off `dev` first — before making any changes. Name the branch after the issue (e.g., `feature/123-recipe-search`).

## Create a new branch off dev

Always pull the latest `dev` before branching:

```bash
git checkout dev
git pull origin dev
git checkout -b <branch-name>
```

## Naming conventions

Use descriptive, kebab-case branch names with a type prefix:

```
feature/<short-description>
fix/<short-description>
chore/<short-description>
```

### Examples

```bash
git checkout dev && git pull origin dev && git checkout -b feature/recipe-search
git checkout dev && git pull origin dev && git checkout -b fix/auth-redirect
git checkout dev && git pull origin dev && git checkout -b chore/update-deps
```

## After creating the branch

```bash
# Verify you're on the new branch
git branch --show-current

# Start working, then push when ready
git push -u origin <branch-name>
```
