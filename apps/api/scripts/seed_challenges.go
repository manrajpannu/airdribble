//go:build ignore

// Run with: go run ./scripts/seed_challenges.go
package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	_ "modernc.org/sqlite"
)

type ChallengeRow struct {
	Slug        string
	Title       string
	Description string
	Tags        []string
	Thumbnail   string
	Icon        string
	DurationMS  int
	Difficulty  int
	ConfigJSON  string
}

var challenges = []ChallengeRow{
	{
		Slug:        "tutorial",
		Title:       "Tutorial",
		Description: "Learn the basics of moving, air rolling, and shooting.",
		Tags:        []string{"basics", "tutorial"},
		Thumbnail:   "from-zinc-500/20 to-zinc-500/5",
		Icon:        "tracking",
		DurationMS:  60000,
		Difficulty:  1,
		ConfigJSON:  `{}`,
	},
	{
		Slug:        "one-shot",
		Title:       "One Shot",
		Description: "Make accurate and powerful shots to score goals.",
		Tags:        []string{"accuracy", "easy"},
		Thumbnail:   "from-blue-500/20 to-blue-500/5",
		Icon:        "precision",
		DurationMS:  60000,
		Difficulty:  2,
		ConfigJSON: `{
			"numBalls": 1,
			"killEffect": "whiteGlitter",
			"health": 1,
			"size": 4,
			"timeLimit": 60,
			"boundary": 40,
			"colors": ["#3459ff","#04f460","#f4e404","#f776fc","#3cff94","#3ee9ff"],
			"pointsPerKill": 100,
			"pointsPerHit": 0,
			"pointsPerMiss": -50
		}`,
	},
	{
		Slug:        "ball-tracking",
		Title:       "Ball Tracking",
		Description: "Track and control the ball with precision.",
		Tags:        []string{"tracking", "control", "intermediate"},
		Thumbnail:   "from-green-500/20 to-green-500/5",
		Icon:        "tracking",
		DurationMS:  60000,
		Difficulty:  3,
		ConfigJSON: `{
			"numBalls": 1,
			"health": 100,
			"holdSliderEnabled": true,
			"holdSliderSeconds": 5.0,
			"movement": "flow",
			"size": [2.0],
			"timeLimit": 60,
			"boundary": 40,
			"colors": ["#04f460"],
			"pointsPerKill": 25,
			"pointsPerHit": 1,
			"pointsPerMiss": 0
		}`,
	},
	{
		Slug:        "direction-control",
		Title:       "Direction Control",
		Description: "Improve your aerial control and shot direction.",
		Tags:        []string{"direction", "control", "intermediate"},
		Thumbnail:   "from-purple-500/20 to-purple-500/5",
		Icon:        "precision",
		DurationMS:  60000,
		Difficulty:  4,
		ConfigJSON: `{
			"numBalls": 3,
			"health": 3,
			"size": [3, 5],
			"timeLimit": 60,
			"boundary": 40,
			"colors": ["#f776fc","#3ee9ff"],
			"isStriped": true,
			"onHoverEffect": "none",
			"stripedAngle": "random",
			"pointsPerKill": 50,
			"pointsPerHit": 10,
			"pointsPerMiss": -20
		}`,
	},
}

func main() {
	_ = godotenv.Load(".env")
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		dbURL = "file:./data.db"
	}

	db, err := sql.Open("libsql", dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Apply schema additions (idempotent — fails silently if column exists)
	migrations := []string{
		`ALTER TABLE challenges ADD COLUMN slug TEXT`,
		`ALTER TABLE challenges ADD COLUMN title TEXT`,
		`ALTER TABLE challenges ADD COLUMN tags TEXT DEFAULT '[]'`,
		`ALTER TABLE challenges ADD COLUMN thumbnail TEXT DEFAULT ''`,
		`ALTER TABLE challenges ADD COLUMN icon TEXT DEFAULT 'precision'`,
	}
	for _, m := range migrations {
		_, err := db.Exec(m)
		if err != nil {
			// Column already exists — skip
			fmt.Printf("  (skip) %s\n", err)
		}
	}

	for _, ch := range challenges {
		tags, _ := json.Marshal(ch.Tags)

		_, err := db.Exec(`
			INSERT INTO challenges (slug, title, name, description, tags, thumbnail, icon, duration_ms, seed_type, difficulty, active, config_json)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'fixed', ?, 1, ?)
			ON CONFLICT(slug) DO UPDATE SET
				title = excluded.title,
				name = excluded.name,
				description = excluded.description,
				tags = excluded.tags,
				thumbnail = excluded.thumbnail,
				icon = excluded.icon,
				duration_ms = excluded.duration_ms,
				difficulty = excluded.difficulty,
				config_json = excluded.config_json,
				updated_at = CURRENT_TIMESTAMP
		`, ch.Slug, ch.Title, ch.Title, ch.Description, string(tags), ch.Thumbnail, ch.Icon, ch.DurationMS, ch.Difficulty, ch.ConfigJSON)
		if err != nil {
			// ON CONFLICT requires a UNIQUE constraint on slug — add it if missing
			log.Printf("Upsert failed for %s (slug may not have UNIQUE constraint): %v\n", ch.Slug, err)
			// Fallback: plain INSERT OR REPLACE won't work without unique; do update if exists
			var id int
			row := db.QueryRow(`SELECT id FROM challenges WHERE slug = ?`, ch.Slug)
			if row.Scan(&id) == nil {
				db.Exec(`UPDATE challenges SET title=?, name=?, description=?, tags=?, thumbnail=?, icon=?, duration_ms=?, difficulty=?, config_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
					ch.Title, ch.Title, ch.Description, string(tags), ch.Thumbnail, ch.Icon, ch.DurationMS, ch.Difficulty, ch.ConfigJSON, id)
				fmt.Printf("  updated: %s (id=%d)\n", ch.Slug, id)
			} else {
				db.Exec(`INSERT INTO challenges (slug, title, name, description, tags, thumbnail, icon, duration_ms, seed_type, difficulty, active, config_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'fixed', ?, 1, ?)`,
					ch.Slug, ch.Title, ch.Title, ch.Description, string(tags), ch.Thumbnail, ch.Icon, ch.DurationMS, ch.Difficulty, ch.ConfigJSON)
				fmt.Printf("  inserted: %s\n", ch.Slug)
			}
			continue
		}
		fmt.Printf("  upserted: %s\n", ch.Slug)
	}

	fmt.Println("Done.")
}
