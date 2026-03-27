-- Seed data for development environment
-- This file contains sample data for testing

-- Sample users seeded via WorkOS (matching the current schema)
INSERT INTO users (workos_user_id, email, name) VALUES
    ('user_test_01', 'john.doe@example.com', 'John Doe'),
    ('user_test_02', 'jane.smith@example.com', 'Jane Smith'),
    ('user_test_03', 'bob.wilson@example.com', 'Bob Wilson')
ON CONFLICT (email) DO NOTHING;

-- Note: In production, NEVER commit actual credentials or sensitive data
-- This is for development/testing only
