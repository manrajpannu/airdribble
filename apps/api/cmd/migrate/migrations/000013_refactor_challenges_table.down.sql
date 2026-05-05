-- Migration: Refactor challenges table (Down)
-- Re-adds duration_ms, seed_type, difficulty, and name columns.

CREATE TABLE challenges_old (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(64) NOT NULL,
    slug TEXT UNIQUE,
    title TEXT,
    description TEXT,
    tags TEXT DEFAULT '[]',
    thumbnail TEXT DEFAULT '',
    icon TEXT DEFAULT 'precision',
    duration_ms INTEGER DEFAULT 60000,
    seed_type TEXT DEFAULT 'fixed',
    difficulty INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT TRUE,
    config_json TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO challenges_old (
    id, slug, title, name, description, tags, thumbnail, icon, active, config_json, likes, dislikes, created_at, updated_at
)
SELECT 
    id, slug, title, title, description, tags, thumbnail, icon, active, config_json, likes, dislikes, created_at, updated_at
FROM challenges;

DROP TABLE challenges;
ALTER TABLE challenges_old RENAME TO challenges;
