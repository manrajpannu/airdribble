package database

import (
	"database/sql"
	"encoding/json"
)

type ChallengeModel struct {
	DB *sql.DB
}

// Challenge represents a training challenge with its full configuration.
// The Config field is parsed from the config_json column.
type Challenge struct {
	ID          int                    `json:"id"`
	Slug        string                 `json:"slug"`
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	Tags        []string               `json:"tags"`
	Thumbnail   string                 `json:"thumbnail"`
	Icon        string                 `json:"icon"`
	DurationMS  int                    `json:"duration_ms"`
	Difficulty  int                    `json:"difficulty"`
	Active      bool                   `json:"active"`
	Config      map[string]interface{} `json:"config"`
	CreatedAt   string                 `json:"created_at"`
	UpdatedAt   string                 `json:"updated_at"`
}

// scanChallenge scans a row into a Challenge, parsing JSON fields.
func scanChallenge(scan func(dest ...interface{}) error) (*Challenge, error) {
	var c Challenge
	var tagsJSON, configJSON string
	var slug, title, thumbnail, icon sql.NullString

	err := scan(
		&c.ID,
		&slug,
		&title,
		&c.Description,
		&tagsJSON,
		&thumbnail,
		&icon,
		&c.DurationMS,
		&c.Difficulty,
		&c.Active,
		&configJSON,
		&c.CreatedAt,
		&c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	c.Slug = slug.String
	c.Title = title.String
	c.Thumbnail = thumbnail.String
	c.Icon = icon.String

	// Parse tags JSON array
	if tagsJSON != "" {
		_ = json.Unmarshal([]byte(tagsJSON), &c.Tags)
	}
	if c.Tags == nil {
		c.Tags = []string{}
	}

	// Parse config JSON object
	if configJSON != "" {
		_ = json.Unmarshal([]byte(configJSON), &c.Config)
	}
	if c.Config == nil {
		c.Config = map[string]interface{}{}
	}

	return &c, nil
}

const selectCols = `SELECT id, slug, title, description, tags, thumbnail, icon, duration_ms, difficulty, active, config_json, created_at, updated_at`

// GetAll retrieves all active challenges from the database.
func (m *ChallengeModel) GetAll() ([]*Challenge, error) {
	rows, err := m.DB.Query(selectCols + ` FROM challenges WHERE active = 1 ORDER BY difficulty ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	challenges := []*Challenge{}
	for rows.Next() {
		c, err := scanChallenge(rows.Scan)
		if err != nil {
			return nil, err
		}
		challenges = append(challenges, c)
	}
	return challenges, rows.Err()
}

// Get retrieves a challenge by its slug (e.g. "ball-tracking").
func (m *ChallengeModel) Get(slug string) (*Challenge, error) {
	row := m.DB.QueryRow(selectCols+` FROM challenges WHERE slug = ?`, slug)
	c, err := scanChallenge(row.Scan)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return c, err
}

// GetByID retrieves a challenge by numeric ID (used internally for sessions).
func (m *ChallengeModel) GetByID(id int) (*Challenge, error) {
	row := m.DB.QueryRow(selectCols+` FROM challenges WHERE id = ?`, id)
	c, err := scanChallenge(row.Scan)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return c, err
}

// Exists checks if a challenge with the given numeric ID exists.
func (m *ChallengeModel) Exists(challengeID int) (bool, error) {
	var exists bool
	err := m.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM challenges WHERE id = ?)`, challengeID).Scan(&exists)
	return exists, err
}
