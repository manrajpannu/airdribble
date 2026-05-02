package database

import (
	"database/sql"
	"fmt"
)

type LeaderboardModel struct {
	DB *sql.DB
}

type User struct {
	Name string `json:"name"`
	Rank Rank   `json:"rank"`
}

type Leaderboard struct {
	ID           int    `json:"id"`
	UserToken    string `json:"-"`
	User         User   `json:"guest_user"`
	SessionToken string `json:"-"`
	ChallengeID  int    `json:"challenge_id"`
	Score        int    `json:"score" binding:"required"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

func (m *LeaderboardModel) Get(challengeID int) ([]*Leaderboard, error) {
	rows, err := m.DB.Query(`
		SELECT
			l.id,
			l.user_token,
			l.session_token,
			l.challenge_id,
			l.score,
			l.created_at,
			l.updated_at,
			u.username,
			r.id,
			r.tier,
			r.tier_number,
			r.division
		FROM leaderboards l
		JOIN guest_users u ON u.token = l.user_token
		LEFT JOIN ranks r ON r.id = u.rank_id
		WHERE l.challenge_id = ?
		ORDER BY l.score DESC
	`, challengeID)
	if err != nil {
		// print the error
		fmt.Println("Error querying leaderboards:", err)
		return nil, err
	}
	defer rows.Close()

	var leaderboards []*Leaderboard

	for rows.Next() {
		var l Leaderboard
		err := rows.Scan(
			&l.ID,
			&l.UserToken,
			&l.SessionToken,
			&l.ChallengeID,
			&l.Score,
			&l.CreatedAt,
			&l.UpdatedAt,

			&l.User.Name,

			&l.User.Rank.ID,
			&l.User.Rank.Name,
			&l.User.Rank.TierNumber,
			&l.User.Rank.Division,
		)
		if err != nil {
			return nil, err
		}

		leaderboards = append(leaderboards, &l)
	}

	return leaderboards, rows.Err()
}

func (m *LeaderboardModel) GetBestScore(userToken string, challengeID int) (*Leaderboard, error) {
	var l Leaderboard
	err := m.DB.QueryRow(`
		SELECT 
			l.id, 
			l.user_token, 
			l.session_token, 
			l.challenge_id, 
			l.score, 
			l.created_at, 
			l.updated_at, 
			u.username, 
			r.id, 
			r.tier, 
			r.tier_number, 
			r.division
		FROM leaderboards l
		JOIN guest_users u ON u.token = l.user_token
		LEFT JOIN ranks r ON r.id = u.rank_id
		WHERE l.user_token = ? AND l.challenge_id = ?
	`, userToken, challengeID).Scan(
		&l.ID,
		&l.UserToken,
		&l.SessionToken,
		&l.ChallengeID,
		&l.Score,
		&l.CreatedAt,
		&l.UpdatedAt,
		&l.User.Name,
		&l.User.Rank.ID,
		&l.User.Rank.Name,
		&l.User.Rank.TierNumber,
		&l.User.Rank.Division,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	} else {
		return &l, nil
	}
}

func (m *LeaderboardModel) Insert(Score *Score) error {

	_, err := m.DB.Exec("INSERT INTO leaderboards (user_token, session_token, challenge_id, score) VALUES (?, ?, ?, ?)",
		Score.UserToken,
		Score.SessionToken,
		Score.ChallengeID,
		Score.Score,
	)
	return err
}

func (m *LeaderboardModel) Update(Score *Score) error {
	_, err := m.DB.Exec("UPDATE leaderboards SET  score = ?, updated_at = CURRENT_TIMESTAMP WHERE user_token = ? AND challenge_id = ?",
		Score.Score,
		Score.UserToken,
		Score.ChallengeID,
	)
	return err
}

func (m *LeaderboardModel) CalculatePercentile(userToken string, challengeID int) (float64, error) {
	var percentile float64
	err := m.DB.QueryRow(`
		SELECT
			(SELECT COUNT(*) FROM leaderboards WHERE challenge_id = ? AND score < (SELECT score FROM leaderboards WHERE user_token = ? AND challenge_id = ?)) * 100.0 /
			(SELECT COUNT(*) FROM leaderboards WHERE challenge_id = ?)
	`, challengeID, userToken, challengeID, challengeID).Scan(&percentile)
	if err != nil {
		return 0, err
	}
	return percentile, nil
}
