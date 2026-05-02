CREATE TABLE IF NOT EXISTS challenge_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_token VARCHAR(64) NOT NULL REFERENCES guest_users(token),
    challenge_id INTEGER NOT NULL REFERENCES challenges(id),
    session_token VARCHAR(64) UNIQUE NOT NULL,
    seed INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    metadata TEXT,
    used BOOLEAN DEFAULT FALSE
);
