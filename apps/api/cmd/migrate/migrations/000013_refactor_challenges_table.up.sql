-- Migration: Refactor challenges table
-- Removes duration_ms, seed_type, difficulty, and name columns.
-- Consolidates title and name into title.

CREATE TABLE challenges_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    title TEXT,
    description TEXT,
    tags TEXT DEFAULT '[]',
    thumbnail TEXT DEFAULT '',
    icon TEXT DEFAULT 'precision',
    active BOOLEAN DEFAULT TRUE,
    config_json TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO challenges_new (
    id, slug, title, description, tags, thumbnail, icon, active, config_json, likes, dislikes, created_at, updated_at
)
SELECT 
    id, slug, COALESCE(title, name), description, tags, thumbnail, icon, active, config_json, likes, dislikes, created_at, updated_at
FROM challenges;

DROP TABLE challenges;
ALTER TABLE challenges_new RENAME TO challenges;
