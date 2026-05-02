package database

import "database/sql"

type ChallengeModel struct {
	DB *sql.DB
}

type Challenge struct {
	ID          int    `json:"id"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	DurationMS  int    `json:"duration_ms" binding:"required"`
	SeedType    string `json:"seed_type" binding:"required"`
	Difficulty  int    `json:"difficulty" binding:"required"`
	Active      bool   `json:"active"`
	ConfigJSON  string `json:"config_json" binding:"required"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// GetAll retrieves all challenges from the database
func (m *ChallengeModel) GetAll() ([]*Challenge, error) {
	rows, err := m.DB.Query("SELECT id, name, description, duration_ms, seed_type, difficulty, active, config_json, created_at, updated_at FROM challenges")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	challenges := []*Challenge{}
	for rows.Next() {
		var c Challenge
		err := rows.Scan(
			&c.ID,
			&c.Name,
			&c.Description,
			&c.DurationMS,
			&c.SeedType,
			&c.Difficulty,
			&c.Active,
			&c.ConfigJSON,
			&c.CreatedAt,
			&c.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		challenges = append(challenges, &c)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return challenges, nil
}

// Get retrieves a challenge by ID
func (m *ChallengeModel) Get(id int) (*Challenge, error) {
	var c Challenge
	err := m.DB.QueryRow("SELECT id, name, description, duration_ms, seed_type, difficulty, active, config_json, created_at, updated_at FROM challenges WHERE id = ?", id).Scan(
		&c.ID,
		&c.Name,
		&c.Description,
		&c.DurationMS,
		&c.SeedType,
		&c.Difficulty,
		&c.Active,
		&c.ConfigJSON,
		&c.CreatedAt,
		&c.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

// Exists checks if a challenge with the given ID exists in the database
func (m *ChallengeModel) Exists(challengeID int) (bool, error) {
	var exists bool
	err := m.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM challenges WHERE id = ?)", challengeID).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
