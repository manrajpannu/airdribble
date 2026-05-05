ALTER TABLE challenges ADD COLUMN likes INT DEFAULT 0;
ALTER TABLE challenges ADD COLUMN dislikes INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS challenge_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    user_token TEXT NOT NULL,
    rating INTEGER NOT NULL, -- 1 for like, -1 for dislike
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(challenge_id, user_token),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id)
);
