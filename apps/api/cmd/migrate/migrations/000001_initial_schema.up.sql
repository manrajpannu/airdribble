-- Initial Schema (Consolidated)

CREATE TABLE IF NOT EXISTS ranks (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	tier VARCHAR(50) NOT NULL,
	tier_number INTEGER CHECK (tier_number BETWEEN 1 AND 3 OR tier_number IS NULL),
	division INTEGER CHECK (division BETWEEN 1 AND 4 OR division IS NULL)
);

CREATE TABLE IF NOT EXISTS guest_users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	token TEXT UNIQUE NOT NULL,
	username TEXT UNIQUE NOT NULL,
	rank_id INTEGER,
	location TEXT,
	ip_address TEXT,
	games_played INTEGER DEFAULT 0,
	shots INTEGER DEFAULT 0,
	kills INTEGER DEFAULT 0,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (rank_id) REFERENCES ranks(id)
);

CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS challenge_sessions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	challenge_id INTEGER NOT NULL,
	user_token TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    seed INTEGER DEFAULT 0,
	is_completed BOOLEAN DEFAULT FALSE,
    used BOOLEAN DEFAULT FALSE,
    metadata TEXT,
	started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	ended_at TIMESTAMP,
	FOREIGN KEY (challenge_id) REFERENCES challenges (id),
    FOREIGN KEY (user_token) REFERENCES guest_users(token)
);

CREATE TABLE IF NOT EXISTS scores (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	challenge_id INTEGER NOT NULL,
	session_id INTEGER,
    session_token TEXT,
	user_token TEXT NOT NULL,
	score INTEGER NOT NULL,
	shots INTEGER NOT NULL DEFAULT 0,
	kills INTEGER NOT NULL DEFAULT 0,
    accuracy REAL DEFAULT 0,
    damage_dealt INTEGER DEFAULT 0,
    damage_possible INTEGER DEFAULT 0,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (challenge_id) REFERENCES challenges (id),
	FOREIGN KEY (session_id) REFERENCES challenge_sessions (id),
    FOREIGN KEY (user_token) REFERENCES guest_users(token)
);

CREATE TABLE IF NOT EXISTS leaderboards (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	challenge_id INTEGER NOT NULL,
	user_token TEXT NOT NULL,
    session_token TEXT,
	score INTEGER NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (challenge_id) REFERENCES challenges (id),
    FOREIGN KEY (user_token) REFERENCES guest_users(token)
);

CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_token VARCHAR(64) NOT NULL,
    type VARCHAR(20) NOT NULL,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id),
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_token) REFERENCES guest_users(token)
);

CREATE TABLE IF NOT EXISTS challenge_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    user_token TEXT NOT NULL,
    rating INTEGER NOT NULL, -- 1 for like, -1 for dislike
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(challenge_id, user_token),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (user_token) REFERENCES guest_users(token)
);

CREATE INDEX idx_user_activity_user_token ON user_activity(user_token);
CREATE INDEX idx_leaderboards_challenge_score ON leaderboards(challenge_id, score DESC);

-- Seed Rocket League ranks
INSERT INTO ranks (tier, tier_number, division) VALUES
('Bronze', 1, 1), ('Bronze', 1, 2), ('Bronze', 1, 3), ('Bronze', 1, 4),
('Bronze', 2, 1), ('Bronze', 2, 2), ('Bronze', 2, 3), ('Bronze', 2, 4),
('Bronze', 3, 1), ('Bronze', 3, 2), ('Bronze', 3, 3), ('Bronze', 3, 4),
('Silver', 1, 1), ('Silver', 1, 2), ('Silver', 1, 3), ('Silver', 1, 4),
('Silver', 2, 1), ('Silver', 2, 2), ('Silver', 2, 3), ('Silver', 2, 4),
('Silver', 3, 1), ('Silver', 3, 2), ('Silver', 3, 3), ('Silver', 3, 4),
('Gold', 1, 1), ('Gold', 1, 2), ('Gold', 1, 3), ('Gold', 1, 4),
('Gold', 2, 1), ('Gold', 2, 2), ('Gold', 2, 3), ('Gold', 2, 4),
('Gold', 3, 1), ('Gold', 3, 2), ('Gold', 3, 3), ('Gold', 3, 4),
('Platinum', 1, 1), ('Platinum', 1, 2), ('Platinum', 1, 3), ('Platinum', 1, 4),
('Platinum', 2, 1), ('Platinum', 2, 2), ('Platinum', 2, 3), ('Platinum', 2, 4),
('Platinum', 3, 1), ('Platinum', 3, 2), ('Platinum', 3, 3), ('Platinum', 3, 4),
('Diamond', 1, 1), ('Diamond', 1, 2), ('Diamond', 1, 3), ('Diamond', 1, 4),
('Diamond', 2, 1), ('Diamond', 2, 2), ('Diamond', 2, 3), ('Diamond', 2, 4),
('Diamond', 3, 1), ('Diamond', 3, 2), ('Diamond', 3, 3), ('Diamond', 3, 4),
('Champion', 1, 1), ('Champion', 1, 2), ('Champion', 1, 3), ('Champion', 1, 4),
('Champion', 2, 1), ('Champion', 2, 2), ('Champion', 2, 3), ('Champion', 2, 4),
('Champion', 3, 1), ('Champion', 3, 2), ('Champion', 3, 3), ('Champion', 3, 4),
('Grand Champion', 1, 1), ('Grand Champion', 1, 2), ('Grand Champion', 1, 3), ('Grand Champion', 1, 4),
('Grand Champion', 2, 1), ('Grand Champion', 2, 2), ('Grand Champion', 2, 3), ('Grand Champion', 2, 4),
('Grand Champion', 3, 1), ('Grand Champion', 3, 2), ('Grand Champion', 3, 3), ('Grand Champion', 3, 4),
('Supersonic Legend', NULL, NULL);
