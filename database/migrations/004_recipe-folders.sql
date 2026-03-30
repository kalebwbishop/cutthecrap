-- Up Migration

-- Recipe folders: flat folders for organizing saved recipes
CREATE TABLE recipe_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Add optional folder reference to saved recipes
ALTER TABLE saved_recipes
    ADD COLUMN folder_id UUID REFERENCES recipe_folders(id) ON DELETE SET NULL;

CREATE INDEX idx_saved_recipes_folder ON saved_recipes(folder_id);

-- Down Migration

ALTER TABLE saved_recipes DROP COLUMN IF EXISTS folder_id;
DROP TABLE IF EXISTS recipe_folders CASCADE;
