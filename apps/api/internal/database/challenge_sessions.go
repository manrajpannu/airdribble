package database

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type ChallengeSessionModel struct {
	DB *sql.DB
}

type ChallengeSession struct {
	ID           int    `json:"id"`
	UserToken    string `json:"user_token" binding:"required"`
	ChallengeID  int    `json:"challenge_id" binding:"required"`
	SessionToken string `json:"session_token" binding:"required"`
	Seed         int    `json:"seed" binding:"required"`
	StartedAt    string `json:"started_at"`
	EndedAt      string `json:"ended_at"`
	Metadata     string `json:"metadata"`
	Used         bool   `json:"used"`
}

func (m *ChallengeSessionModel) Insert(UserToken string, ChallengeID int, SessionToken string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `INSERT INTO challenge_sessions (user_token, challenge_id, session_token) VALUES (?, ?, ?)`

	_, err := m.DB.ExecContext(ctx, query, UserToken, ChallengeID, SessionToken)
	if err != nil {
		return err
	}

	return nil
}

func (m *ChallengeSessionModel) End(userToken string, sessionToken string, challengeDuration time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	// Convert duration to seconds
	seconds := int(challengeDuration.Seconds())

	query := `
		UPDATE challenge_sessions
		SET
			ended_at = CURRENT_TIMESTAMP,
			used = 1
		WHERE
			session_token = ?
			AND user_token = ?
			AND used = 0
			AND datetime(started_at, '+' || ? || ' seconds') > CURRENT_TIMESTAMP
	`

	result, err := m.DB.ExecContext(ctx, query, sessionToken, userToken, seconds)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return errors.New("session invalid, expired, or already ended")
	}

	return nil
}

func (m *ChallengeSessionModel) GetChallengeID(userToken string, sessionToken string) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `
		SELECT challenge_id 
		FROM challenge_sessions 
		WHERE session_token = ?
		AND user_token = ?
	`
	row := m.DB.QueryRowContext(ctx, query, sessionToken, userToken)
	var challengeID int
	err := row.Scan(&challengeID)
	if err != nil {
		return 0, err
	}
	return challengeID, nil

}
type ActivityRecord struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
	Level int    `json:"level"`
}

func (m *ChallengeSessionModel) GetActivity(userToken string, days int) ([]*ActivityRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `
		SELECT 
			DATE(started_at) as date, 
			COUNT(*) as count 
		FROM challenge_sessions 
		WHERE user_token = ? 
		AND started_at >= DATE('now', '-' || ? || ' days') 
		GROUP BY date
		ORDER BY date ASC
	`

	rows, err := m.DB.QueryContext(ctx, query, userToken, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	activity := []*ActivityRecord{}
	for rows.Next() {
		var r ActivityRecord
		if err := rows.Scan(&r.Date, &r.Count); err != nil {
			return nil, err
		}

		// Map count to level (1-4) for heatmap intensity
		if r.Count >= 8 {
			r.Level = 4
		} else if r.Count >= 5 {
			r.Level = 3
		} else if r.Count >= 3 {
			r.Level = 2
		} else {
			r.Level = 1
		}

		activity = append(activity, &r)
	}

	return activity, nil
}
