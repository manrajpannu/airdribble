package database

import (
	"context"
	"database/sql"
	"time"
)

type ScoreModel struct {
	DB *sql.DB
}

type Score struct {
	ID           int    `json:"id"`
	UserToken    string `json:"-"`
	SessionToken string `json:"-"`
	ChallengeID  int    `json:"challenge_id"`
	Score        int    `json:"score" binding:"required"`
	CreatedAt    string `json:"created_at"`
}

// Create adds a new score record to the database
func (m *ScoreModel) Insert(score *Score) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `INSERT INTO scores (user_token, session_token, challenge_id, score) VALUES (?, ?, ?, ?)`

	_, err := m.DB.ExecContext(ctx, query, score.UserToken, score.SessionToken, score.ChallengeID, score.Score)
	if err != nil {
		return err
	}
	return nil
}

// GetAll retrieves scores by user token and challenge ID
func (m *ScoreModel) GetAll(userToken string, challengeID int) ([]*Score, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `SELECT id, user_token, session_token, challenge_id, score, created_at FROM scores WHERE user_token = ? AND challenge_id = ?`

	rows, err := m.DB.QueryContext(ctx, query, userToken, challengeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	scores := []*Score{}
	for rows.Next() {
		var s Score
		err := rows.Scan(&s.ID, &s.UserToken, &s.SessionToken, &s.ChallengeID, &s.Score, &s.CreatedAt)
		if err != nil {
			return nil, err
		}
		scores = append(scores, &s)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}
	return scores, nil
}
