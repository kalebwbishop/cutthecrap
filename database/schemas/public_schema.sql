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

-- ── Recipe Folders ───────────────────────────────────────────────────

CREATE TABLE recipe_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_folder_name UNIQUE (user_id, name)
);

CREATE INDEX idx_recipe_folders_user ON recipe_folders(user_id);

CREATE TRIGGER update_recipe_folders_updated_at
    BEFORE UPDATE ON recipe_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE recipe_folders IS 'Flat folders for organizing saved recipes per user';

-- Add folder reference to saved recipes
ALTER TABLE saved_recipes
    ADD COLUMN folder_id UUID REFERENCES recipe_folders(id) ON DELETE SET NULL;

CREATE INDEX idx_saved_recipes_folder ON saved_recipes(folder_id);

-- ── Recipe History───────────────────────────────────────────────────

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

-- ── Billing Products ────────────────────────────────────────────────

CREATE TABLE billing_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL,
    external_product_id VARCHAR(255) NOT NULL,
    entitlement_key VARCHAR(100) NOT NULL,
    billing_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_platform_product UNIQUE (platform, external_product_id)
);

CREATE INDEX idx_billing_products_entitlement ON billing_products(entitlement_key);

CREATE TRIGGER update_billing_products_updated_at
    BEFORE UPDATE ON billing_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE billing_products IS 'Maps platform-specific product/SKU IDs to internal entitlement keys';

-- ── Billing Transactions ────────────────────────────────────────────

CREATE TABLE billing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL,
    external_transaction_id VARCHAR(500) NOT NULL,
    external_original_id VARCHAR(500),
    external_product_id VARCHAR(255) NOT NULL,
    raw_payload JSONB,
    environment VARCHAR(20) NOT NULL DEFAULT 'production',
    purchased_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_source_transaction UNIQUE (source, external_transaction_id)
);

CREATE INDEX idx_billing_transactions_user ON billing_transactions(user_id);
CREATE INDEX idx_billing_transactions_source ON billing_transactions(source);
CREATE INDEX idx_billing_transactions_external_original ON billing_transactions(external_original_id);

CREATE TRIGGER update_billing_transactions_updated_at
    BEFORE UPDATE ON billing_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE billing_transactions IS 'Verified purchase/subscription transactions from all billing platforms';

-- ── User Entitlements ───────────────────────────────────────────────

CREATE TABLE user_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entitlement_key VARCHAR(100) NOT NULL,
    source VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    external_ref VARCHAR(500),
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_entitlement_source UNIQUE (user_id, entitlement_key, source)
);

CREATE INDEX idx_user_entitlements_user ON user_entitlements(user_id);
CREATE INDEX idx_user_entitlements_key_status ON user_entitlements(entitlement_key, status);
CREATE INDEX idx_user_entitlements_expires ON user_entitlements(expires_at) WHERE expires_at IS NOT NULL;

CREATE TRIGGER update_user_entitlements_updated_at
    BEFORE UPDATE ON user_entitlements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_entitlements IS 'Authoritative source of user feature access, projected from billing transactions';
COMMENT ON COLUMN user_entitlements.status IS 'active, expired, revoked, grace_period, billing_retry, paused';

-- ── Billing Webhook Events ──────────────────────────────────────────

CREATE TABLE billing_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(20) NOT NULL,
    event_id VARCHAR(500) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_provider_event UNIQUE (provider, event_id)
);

CREATE INDEX idx_billing_webhook_events_provider ON billing_webhook_events(provider);

COMMENT ON TABLE billing_webhook_events IS 'Tracks processed webhook events for idempotency';

-- ── Seed billing products ───────────────────────────────────────────

INSERT INTO billing_products (platform, external_product_id, entitlement_key, billing_type) VALUES
    ('ios', 'ios.pro_monthly', 'pro', 'subscription'),
    ('ios', 'ios.pro_yearly', 'pro', 'subscription'),
    ('ios', 'ios.pro_lifetime', 'pro', 'non_consumable'),
    ('android', 'android.pro_monthly', 'pro', 'subscription'),
    ('android', 'android.pro_yearly', 'pro', 'subscription'),
    ('android', 'android.pro_lifetime', 'pro', 'non_consumable'),
    ('web', 'web.pro_monthly', 'pro', 'subscription'),
    ('web', 'web.pro_yearly', 'pro', 'subscription'),
    ('web', 'web.pro_lifetime', 'pro', 'non_consumable');

