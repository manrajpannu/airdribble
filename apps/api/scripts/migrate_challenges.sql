-- Migration: modernise challenges table
-- Adds slug, title, tags, thumbnail, icon columns
-- Renames name → kept for backward compat but title is the primary display field

ALTER TABLE challenges ADD COLUMN slug TEXT;
ALTER TABLE challenges ADD COLUMN title TEXT;
ALTER TABLE challenges ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE challenges ADD COLUMN thumbnail TEXT DEFAULT '';
ALTER TABLE challenges ADD COLUMN icon TEXT DEFAULT 'precision';

-- Back-fill existing rows with sensible defaults
UPDATE challenges SET slug = LOWER(REPLACE(name, ' ', '-')), title = name WHERE slug IS NULL;
