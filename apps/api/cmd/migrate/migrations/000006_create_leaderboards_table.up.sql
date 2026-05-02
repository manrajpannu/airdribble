CREATE TABLE leaderboards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_token VARCHAR(64) NOT NULL REFERENCES guest_users(token),
    challenge_id TEXT NOT NULL REFERENCES challenges(id),
    session_token VARCHAR(64) NOT NULL REFERENCES challenge_sessions(session_token),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);