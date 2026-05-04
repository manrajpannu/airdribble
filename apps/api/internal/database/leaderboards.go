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

type LeaderboardEntry struct {
	Username string `json:"username"`
	Score    int    `json:"score"`
	Rank     int    `json:"rank"`
	IsUser   bool   `json:"is_user"`
	RankID   *int   `json:"rank_id"`
}

type LeaderboardContext struct {
	Top10        []*LeaderboardEntry `json:"top_10"`
	UserEntry    *LeaderboardEntry   `json:"user_entry,omitempty"`
	AboveEntry   *LeaderboardEntry   `json:"above_entry,omitempty"`
	BelowEntry   *LeaderboardEntry   `json:"below_entry,omitempty"`
	MedianScore  int                 `json:"median_score"`
	TotalEntries int                 `json:"total_entries"`
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
		var rankID sql.NullInt64
		var rankName sql.NullString
		err := rows.Scan(
			&l.ID,
			&l.UserToken,
			&l.SessionToken,
			&l.ChallengeID,
			&l.Score,
			&l.CreatedAt,
			&l.UpdatedAt,

			&l.User.Name,

			&rankID,
			&rankName,
			&l.User.Rank.TierNumber,
			&l.User.Rank.Division,
		)
		if err != nil {
			return nil, err
		}

		if rankID.Valid {
			l.User.Rank.ID = int(rankID.Int64)
		}
		if rankName.Valid {
			l.User.Rank.Name = rankName.String
		}

		leaderboards = append(leaderboards, &l)
	}

	return leaderboards, rows.Err()
}

func (m *LeaderboardModel) GetBestScore(userToken string, challengeID int) (*Leaderboard, error) {
	var l Leaderboard
	var rankID sql.NullInt64
	var rankName sql.NullString
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
		&rankID,
		&rankName,
		&l.User.Rank.TierNumber,
		&l.User.Rank.Division,
	)

	if rankID.Valid {
		l.User.Rank.ID = int(rankID.Int64)
	}
	if rankName.Valid {
		l.User.Rank.Name = rankName.String
	}
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

func (m *LeaderboardModel) GetLeaderboardContext(userToken string, challengeID int) (*LeaderboardContext, error) {
	ctx := &LeaderboardContext{
		Top10:     []*LeaderboardEntry{},
		UserEntry: &LeaderboardEntry{},
	}

	// 1. Get Top 10
	rows, err := m.DB.Query(`
		SELECT u.username, l.score, l.user_token, u.rank_id
		FROM leaderboards l
		JOIN guest_users u ON u.token = l.user_token
		WHERE l.challenge_id = ?
		ORDER BY l.score DESC
		LIMIT 10
	`, challengeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var entry LeaderboardEntry
		var token string
		if err := rows.Scan(&entry.Username, &entry.Score, &token, &entry.RankID); err != nil {
			return nil, err
		}
		entry.IsUser = (token == userToken)
		
		// Get rank for this entry (scaleable via index on challenge_id, score)
		rank, err := m.GetRankForScore(challengeID, entry.Score)
		if err != nil {
			return nil, err
		}
		entry.Rank = rank
		
		ctx.Top10 = append(ctx.Top10, &entry)
	}

	// 2. Get User's Score and Rank
	var userScore int
	var username string
	err = m.DB.QueryRow(`
		SELECT l.score, u.username, u.rank_id
		FROM leaderboards l
		JOIN guest_users u ON u.token = l.user_token
		WHERE l.user_token = ? AND l.challenge_id = ?
	`, userToken, challengeID).Scan(&userScore, &username, &ctx.UserEntry.RankID)

	if err != nil {
		if err == sql.ErrNoRows {
			return ctx, nil // User has no score, Top 10 is enough
		}
		return nil, err
	}

	userRank, err := m.GetRankForScore(challengeID, userScore)
	if err != nil {
		return nil, err
	}

	ctx.UserEntry.Username = username
	ctx.UserEntry.Score = userScore
	ctx.UserEntry.Rank = userRank
	ctx.UserEntry.IsUser = true

	// 3. Get Player Above (Limit 1)
	var above LeaderboardEntry
	err = m.DB.QueryRow(`
		SELECT u.username, l.score, u.rank_id
		FROM leaderboards l
		JOIN guest_users u ON u.token = l.user_token
		WHERE l.challenge_id = ? AND l.score > ?
		ORDER BY l.score ASC
		LIMIT 1
	`, challengeID, userScore).Scan(&above.Username, &above.Score, &above.RankID)

	if err == nil {
		aboveRank, _ := m.GetRankForScore(challengeID, above.Score)
		above.Rank = aboveRank
		ctx.AboveEntry = &above
	}

	// 4. Get Player Below (Limit 1)
	var below LeaderboardEntry
	err = m.DB.QueryRow(`
		SELECT u.username, l.score, u.rank_id
		FROM leaderboards l
		JOIN guest_users u ON u.token = l.user_token
		WHERE l.challenge_id = ? AND l.score < ?
		ORDER BY l.score DESC
		LIMIT 1
	`, challengeID, userScore).Scan(&below.Username, &below.Score, &below.RankID)

	if err == nil {
		belowRank, _ := m.GetRankForScore(challengeID, below.Score)
		below.Rank = belowRank
		ctx.BelowEntry = &below
	}

	// 5. Get Median Score and Total Entries
	err = m.DB.QueryRow("SELECT COUNT(*) FROM leaderboards WHERE challenge_id = ?", challengeID).Scan(&ctx.TotalEntries)
	if err != nil {
		return nil, err
	}

	if ctx.TotalEntries > 0 {
		err = m.DB.QueryRow(`
			SELECT score 
			FROM leaderboards 
			WHERE challenge_id = ? 
			ORDER BY score ASC 
			LIMIT 1 OFFSET ?
		`, challengeID, ctx.TotalEntries/2).Scan(&ctx.MedianScore)
		if err != nil {
			return nil, err
		}
	}

	return ctx, nil
}

func (m *LeaderboardModel) GetRankForScore(challengeID, score int) (int, error) {
	var rank int
	err := m.DB.QueryRow("SELECT COUNT(*) + 1 FROM leaderboards WHERE challenge_id = ? AND score > ?", challengeID, score).Scan(&rank)
	return rank, err
}
