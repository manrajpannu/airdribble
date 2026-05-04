CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_token VARCHAR(64) NOT NULL,
    type VARCHAR(20) NOT NULL,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id),
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_token) REFERENCES guest_users(token)
);

CREATE INDEX idx_user_activity_user_token ON user_activity(user_token);
