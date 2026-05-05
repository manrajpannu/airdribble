package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type ChallengeRating struct {
	ID          int       `json:"id"`
	ChallengeID int       `json:"challenge_id"`
	UserToken   string    `json:"user_token"`
	Rating      int       `json:"rating"` // 1 for like, -1 for dislike
	CreatedAt   time.Time `json:"created_at"`
}

type ChallengeRatingModel struct {
	DB *sql.DB
}

func (m *ChallengeRatingModel) SetRating(challengeID int, userToken string, rating int) error {
	if rating != 1 && rating != -1 && rating != 0 {
		return fmt.Errorf("invalid rating: %d", rating)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := m.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Get existing rating
	var existingRating int
	err = tx.QueryRowContext(ctx, "SELECT rating FROM challenge_ratings WHERE challenge_id = ? AND user_token = ?", challengeID, userToken).Scan(&existingRating)
	
	hasExisting := true
	if err != nil {
		if err == sql.ErrNoRows {
			hasExisting = false
		} else {
			return err
		}
	}

	// 2. If same rating, do nothing (or we could treat 0 as "remove rating" if we want toggling)
	if hasExisting && existingRating == rating {
		return nil
	}

	// 3. Update challenge counts
	if hasExisting {
		// Remove old rating effect
		if existingRating == 1 {
			_, err = tx.ExecContext(ctx, "UPDATE challenges SET likes = MAX(0, likes - 1) WHERE id = ?", challengeID)
		} else if existingRating == -1 {
			_, err = tx.ExecContext(ctx, "UPDATE challenges SET dislikes = MAX(0, dislikes - 1) WHERE id = ?", challengeID)
		}
		if err != nil {
			return err
		}
	}

	// 4. Add new rating effect (if not removing)
	if rating != 0 {
		if rating == 1 {
			_, err = tx.ExecContext(ctx, "UPDATE challenges SET likes = likes + 1 WHERE id = ?", challengeID)
		} else if rating == -1 {
			_, err = tx.ExecContext(ctx, "UPDATE challenges SET dislikes = dislikes + 1 WHERE id = ?", challengeID)
		}
		if err != nil {
			return err
		}

		// 5. Upsert the rating
		if hasExisting {
			_, err = tx.ExecContext(ctx, "UPDATE challenge_ratings SET rating = ? WHERE challenge_id = ? AND user_token = ?", rating, challengeID, userToken)
		} else {
			_, err = tx.ExecContext(ctx, "INSERT INTO challenge_ratings (challenge_id, user_token, rating) VALUES (?, ?, ?)", challengeID, userToken, rating)
		}
	} else {
		// Removing rating
		_, err = tx.ExecContext(ctx, "DELETE FROM challenge_ratings WHERE challenge_id = ? AND user_token = ?", challengeID, userToken)
	}

	if err != nil {
		return err
	}

	return tx.Commit()
}

func (m *ChallengeRatingModel) GetUserRating(challengeID int, userToken string) (int, error) {
	var rating int
	err := m.DB.QueryRow("SELECT rating FROM challenge_ratings WHERE challenge_id = ? AND user_token = ?", challengeID, userToken).Scan(&rating)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return rating, err
}
