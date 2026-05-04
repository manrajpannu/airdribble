// No struct defined in this file yet.
package database

import "database/sql"

type Models struct {
	GuestUser        GuestUserModel
	Rank             RankModel
	Challenge        ChallengeModel
	ChallengeSession ChallengeSessionModel
	Score            ScoreModel
	Leaderboard      LeaderboardModel
	UserActivity     UserActivityModel
}

func NewModels(db *sql.DB) Models {
	return Models{
		GuestUser:        GuestUserModel{DB: db},
		Rank:             RankModel{DB: db},
		Challenge:        ChallengeModel{DB: db},
		ChallengeSession: ChallengeSessionModel{DB: db},
		Score:            ScoreModel{DB: db},
		Leaderboard:      LeaderboardModel{DB: db},
		UserActivity:     UserActivityModel{DB: db},
	}
}
