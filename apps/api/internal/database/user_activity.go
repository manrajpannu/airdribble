package database

import (
	"context"
	"database/sql"
	"log"
	"time"
)

type UserActivity struct {
	ID            int    `json:"id"`
	UserToken     string `json:"-"`
	Type          string `json:"type"`
	ChallengeID   int    `json:"challenge_id"`
	ChallengeName string `json:"challenge_name"`
	Score         int    `json:"score"`
	CreatedAt     time.Time `json:"created_at"`
}

type UserActivityModel struct {
	DB *sql.DB
}

func (m *UserActivityModel) Insert(userToken string, activityType string, challengeID int, score int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `INSERT INTO user_activity (user_token, type, challenge_id, score) VALUES (?, ?, ?, ?)`

	log.Printf("Inserting user activity: userToken=%s, type=%s, challengeID=%d, score=%d", userToken, activityType, challengeID, score)
	_, err := m.DB.ExecContext(ctx, query, userToken, activityType, challengeID, score)
	if err != nil {
		log.Printf("Error inserting user activity: %v", err)
	}
	return err
}

func (m *UserActivityModel) GetFeed(userToken string, limit, offset int) ([]*UserActivity, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `
		SELECT ua.id, ua.type, ua.challenge_id, c.title, ua.score, ua.created_at
		FROM user_activity ua
		JOIN challenges c ON ua.challenge_id = c.id
		WHERE ua.user_token = ?
		ORDER BY ua.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := m.DB.QueryContext(ctx, query, userToken, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feed []*UserActivity
	for rows.Next() {
		var ua UserActivity
		err := rows.Scan(&ua.ID, &ua.Type, &ua.ChallengeID, &ua.ChallengeName, &ua.Score, &ua.CreatedAt)
		if err != nil {
			return nil, err
		}
		feed = append(feed, &ua)
	}

	return feed, nil
}
