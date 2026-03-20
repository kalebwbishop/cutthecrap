---
name: database
description: >
  Manage PostgreSQL database migrations using node-pg-migrate for the Cut The Crap app.
  Use for topics related to database, migration, schema changes, create table, alter table,
  add column, drop table, seed data, rollback migration, database reset.
---

# Database Migrations (node-pg-migrate)

> Incremental, versioned PostgreSQL migrations for Cut The Crap.
> Migrations live in `database/migrations/` as plain SQL files.
> Migration state is tracked in a `pgmigrations` table in the database.

## Project setup

Connection string is read from `backend/.env`:
```
POSTGRES_CONNECTION_STRING=postgresql://user:pass@host:port/dbname
```

## Commands

All commands run from the `database/` directory:

```bash
cd database

# Run all pending migrations (safe, incremental)
npm run migrate

# Roll back the last applied migration
npm run migrate:down

# Create a new migration file
npm run migrate:create -- descriptive-name

# Redo last migration (down + up)
npm run migrate:redo

# Legacy destructive reset (drops and recreates all tables from schemas/public_schema.sql)
npm run migrate:reset

# Run seed data
npm run seed
```

## Creating a new migration

```bash
cd database
npm run migrate:create -- add-user-preferences
```

This creates a file like `migrations/<timestamp>_add-user-preferences.sql`.

### Migration file format

Every migration has an **Up** section and a **Down** section separated by comments:

```sql
-- Up Migration

CREATE TABLE example (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_example_name ON example(name);

-- Down Migration

DROP TABLE IF EXISTS example CASCADE;
```

### Rules for writing migrations

1. **Up** section: the forward change (CREATE, ALTER, INSERT, etc.)
2. **Down** section: the exact reverse (DROP, ALTER back, DELETE, etc.)
3. Never modify an already-applied migration — create a new one instead
4. Use `IF NOT EXISTS` / `IF EXISTS` guards where appropriate
5. Keep migrations focused — one logical change per file

## Common migration patterns

### Add a column

```sql
-- Up Migration
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Down Migration
ALTER TABLE users DROP COLUMN IF EXISTS phone;
```

### Add a column with default

```sql
-- Up Migration
ALTER TABLE saved_recipes ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Down Migration
ALTER TABLE saved_recipes DROP COLUMN IF EXISTS is_favorite;
```

### Create a table with foreign key

```sql
-- Up Migration
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES saved_recipes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_recipe ON tags(recipe_id);

-- Down Migration
DROP TABLE IF EXISTS tags CASCADE;
```

### Add an index

```sql
-- Up Migration
CREATE INDEX idx_saved_recipes_source_url ON saved_recipes(source_url);

-- Down Migration
DROP INDEX IF EXISTS idx_saved_recipes_source_url;
```

### Rename a column

```sql
-- Up Migration
ALTER TABLE users RENAME COLUMN name TO display_name;

-- Down Migration
ALTER TABLE users RENAME COLUMN display_name TO name;
```

### Add a trigger (follows project convention)

```sql
-- Up Migration
CREATE TRIGGER update_my_table_updated_at
    BEFORE UPDATE ON my_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Down Migration
DROP TRIGGER IF EXISTS update_my_table_updated_at ON my_table;
```

## Current schema

### Tables

- **users** — `id` (UUID PK), `workos_user_id`, `email`, `name`, `avatar_url`, timestamps
- **saved_recipes** — `id` (UUID PK), `user_id` (FK → users), `title`, `description`, `source_url`, 7 time fields, `total_time`, `servings`, `ingredients` (TEXT[]), `steps` (JSONB), `notes` (TEXT[]), timestamps
- **recipe_history** — same structure as saved_recipes; max 3 per user (enforced at app layer)

### Conventions

- Primary keys: `UUID DEFAULT uuid_generate_v4()`
- Foreign keys: `ON DELETE CASCADE`
- Timestamps: `created_at` + `updated_at` (TIMESTAMPTZ), with `update_updated_at_column()` trigger
- Array columns: `TEXT[] NOT NULL DEFAULT '{}'`
- JSON columns: `JSONB NOT NULL DEFAULT '[]'`
- Index naming: `idx_<table>_<column>`
- Trigger naming: `update_<table>_updated_at`

## Existing migrations

| File | Description |
|---|---|
| `001_initial-schema.sql` | Baseline: users + saved_recipes tables, triggers, indexes |
| `002_recipe-history.sql` | recipe_history table for recent parsed recipes |

## Troubleshooting

### First run on existing database

If your database already has tables from the old destructive migration, the baseline migration will fail. Options:

1. **Reset everything:** `npm run migrate:reset` then `npm run migrate` (loses data)
2. **Mark baseline as applied:** Insert a row into `pgmigrations` manually:
   ```sql
   CREATE TABLE IF NOT EXISTS pgmigrations (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
   INSERT INTO pgmigrations (name) VALUES ('001_initial-schema');
   ```
   Then run `npm run migrate` to apply only new migrations.

### Migration failed halfway

If a migration partially applied, you may need to manually clean up, then re-run. Check what was applied:

```sql
SELECT * FROM pgmigrations ORDER BY run_on;
```
