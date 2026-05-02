CREATE TABLE IF NOT EXISTS ranks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tier VARCHAR(50) NOT NULL,
    tier_number INTEGER CHECK (tier_number BETWEEN 1 AND 3 OR tier_number IS NULL),
    division INTEGER CHECK (division BETWEEN 1 AND 4 OR division IS NULL)
);