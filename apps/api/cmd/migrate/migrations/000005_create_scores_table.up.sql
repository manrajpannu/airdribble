CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_token VARCHAR(64) NOT NULL REFERENCES guest_users(token),
    challenge_id TEXT NOT NULL REFERENCES challenges(id),
    session_token VARCHAR(64) UNIQUE NOT NULL REFERENCES challenge_sessions(session_token),
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);