-- Cut The Crap Database Schema
-- Version: 1.0.0
-- Description: Recipe extraction app – users and saved recipes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Utility function ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Drop existing tables (clean slate) ──────────────────────────────

DROP TABLE IF EXISTS saved_recipes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── Users ───────────────────────────────────────────────────────────

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workos_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_workos_id ON users(workos_user_id);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE users IS 'Core user accounts authenticated via WorkOS';

-- ── Saved Recipes ───────────────────────────────────────────────────

CREATE TABLE saved_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    source_url VARCHAR(2000),
    prep_time VARCHAR(100),
    cook_time VARCHAR(100),
    cool_time VARCHAR(100),
    chill_time VARCHAR(100),
    rest_time VARCHAR(100),
    marinate_time VARCHAR(100),
    soak_time VARCHAR(100),
    total_time VARCHAR(100),
    servings VARCHAR(100),
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    steps JSONB NOT NULL DEFAULT '[]',
    notes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_recipes_user ON saved_recipes(user_id);
CREATE INDEX idx_saved_recipes_created_at ON saved_recipes(created_at DESC);

CREATE TRIGGER update_saved_recipes_updated_at
    BEFORE UPDATE ON saved_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE saved_recipes IS 'Recipes saved by a user, extracted from URLs via the scraper';
COMMENT ON COLUMN saved_recipes.ingredients IS 'Flat list of ingredient strings with quantities';
COMMENT ON COLUMN saved_recipes.steps IS 'JSON array of {instruction, ingredients[]} objects';
COMMENT ON COLUMN saved_recipes.notes IS 'Optional tips, substitutions, storage info';
