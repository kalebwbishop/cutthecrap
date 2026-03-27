-- Cut The Crap Database Schema
-- Version: 2.0.0
-- Description: Recipe extraction app – users, saved recipes, and social features

-- gen_random_uuid() is built-in since PostgreSQL 13; no extension needed.

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
DROP TABLE IF EXISTS group_shared_recipes CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── Users ───────────────────────────────────────────────────────────

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ── Recipe History ───────────────────────────────────────────────────

CREATE TABLE recipe_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_recipe_history_user ON recipe_history(user_id);
CREATE INDEX idx_recipe_history_created_at ON recipe_history(created_at DESC);

CREATE TRIGGER update_recipe_history_updated_at
    BEFORE UPDATE ON recipe_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE recipe_history IS 'Most recent 3 parsed recipes per user (auto-saved, FIFO eviction)';

-- ── Friendships ──────────────────────────────────────────────────────

CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id),
    CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE friendships IS 'Bidirectional friend requests between users';

-- ── Groups ───────────────────────────────────────────────────────────

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_groups_created_by ON groups(created_by);

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE groups IS 'Recipe sharing groups created by users';

-- ── Group Members ────────────────────────────────────────────────────

CREATE TABLE group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_members_user ON group_members(user_id);

COMMENT ON TABLE group_members IS 'Membership in recipe sharing groups';

-- ── Group Shared Recipes ─────────────────────────────────────────────

CREATE TABLE group_shared_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES saved_recipes(id) ON DELETE CASCADE,
    shared_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_group_recipe UNIQUE (group_id, recipe_id)
);

CREATE INDEX idx_group_shared_recipes_group ON group_shared_recipes(group_id);
CREATE INDEX idx_group_shared_recipes_recipe ON group_shared_recipes(recipe_id);

COMMENT ON TABLE group_shared_recipes IS 'Recipes shared by members into groups';
