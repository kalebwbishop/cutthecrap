# Database

PostgreSQL database for Cut The Crap.

## Setup

Connection string is read from `backend/.env`:
```
POSTGRES_CONNECTION_STRING=postgresql://postgres:postgres@localhost:5432/cutthecrap_dev
```

## Migrations (node-pg-migrate)

Incremental, versioned migrations tracked in a `pgmigrations` table.

```bash
cd database
npm install

# Run all pending migrations
npm run migrate

# Roll back the last migration
npm run migrate:down

# Create a new migration file
npm run migrate:create -- my-migration-name

# Redo last migration (down + up)
npm run migrate:redo
```

### Creating a migration

```bash
npm run migrate:create -- add-user-preferences
```

This creates `migrations/<timestamp>_add-user-preferences.sql` with `-- Up Migration` and `-- Down Migration` sections. Write your SQL in each section.

### Legacy (destructive reset)

The old destructive approach is preserved as `migrate:reset`. It drops and recreates all tables from `schemas/public_schema.sql`:

```bash
npm run migrate:reset   # ⚠️ DESTROYS ALL DATA
```

## Seeding

```bash
npm run seed
```

Runs all `seeds/*.sql` files in sorted order.

## Schema

### Tables

#### users
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `workos_user_id` | VARCHAR(255) | Unique, NOT NULL |
| `email` | VARCHAR(255) | Unique, NOT NULL |
| `name` | VARCHAR(255) | NOT NULL |
| `avatar_url` | VARCHAR(500) | Nullable |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

#### saved_recipes
User's explicitly saved recipes.

#### recipe_history
Most recent 3 parsed recipes per user (auto-saved, FIFO eviction).

Both recipe tables share the same column structure: `title`, `description`, `source_url`, 7 time fields, `servings`, `ingredients` (TEXT[]), `steps` (JSONB), `notes` (TEXT[]), timestamps.

## Security

⚠️ **Never commit production credentials.** Use environment variables for connection strings.
