-- Up Migration

-- Billing products: maps platform-specific SKUs to internal entitlement keys
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

-- Billing transactions: records of verified purchases from all platforms
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

-- User entitlements: the authoritative source of feature access
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

-- Billing webhook events: idempotency tracking for processed webhook events
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

-- Seed initial billing products
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

-- Down Migration

DROP TABLE IF EXISTS billing_webhook_events CASCADE;
DROP TABLE IF EXISTS user_entitlements CASCADE;
DROP TABLE IF EXISTS billing_transactions CASCADE;
DROP TABLE IF EXISTS billing_products CASCADE;
