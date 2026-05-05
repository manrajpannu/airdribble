// Seed script — adds/updates all challenge rows in the database.
// Run with: go run ./cmd/seed
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
		ConfigJSON:  `{}`,
	},
	{
		Slug:        "one-shot",
		Title:       "One Shot",
		Description: "Make accurate and powerful shots to score goals.",
		Tags:        []string{"accuracy", "easy"},
		Thumbnail:   "from-blue-500/20 to-blue-500/5",
		Icon:        "precision",
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

	// Clear existing data to ensure a fresh start
	tables := []string{"scores", "challenge_sessions", "guest_users", "challenges"}
	for _, table := range tables {
		_, _ = db.Exec(fmt.Sprintf("DELETE FROM %s", table))
	}



	for _, ch := range challenges {
		tags, _ := json.Marshal(ch.Tags)

		_, err := db.Exec(`
			INSERT INTO challenges (slug, title, description, tags, thumbnail, icon, active, config_json)
			VALUES (?, ?, ?, ?, ?, ?, 1, ?)
			ON CONFLICT(slug) DO UPDATE SET
				title       = excluded.title,
				description = excluded.description,
				tags        = excluded.tags,
				thumbnail   = excluded.thumbnail,
				icon        = excluded.icon,
				config_json = excluded.config_json,
				updated_at  = CURRENT_TIMESTAMP
		`, ch.Slug, ch.Title, ch.Description, string(tags), ch.Thumbnail, ch.Icon, ch.ConfigJSON)
		if err != nil {
			// ON CONFLICT requires a UNIQUE constraint on slug — fallback to manual upsert
			log.Printf("Upsert failed for %s: %v\n", ch.Slug, err)
			var id int
			row := db.QueryRow(`SELECT id FROM challenges WHERE slug = ?`, ch.Slug)
			if row.Scan(&id) == nil {
				db.Exec(`UPDATE challenges SET title=?, description=?, tags=?, thumbnail=?, icon=?, config_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
					ch.Title, ch.Description, string(tags), ch.Thumbnail, ch.Icon, ch.ConfigJSON, id)
				fmt.Printf("  updated: %s (id=%d)\n", ch.Slug, id)
			} else {
				db.Exec(`INSERT INTO challenges (slug, title, description, tags, thumbnail, icon, active, config_json) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
					ch.Slug, ch.Title, ch.Description, string(tags), ch.Thumbnail, ch.Icon, ch.ConfigJSON)
				fmt.Printf("  inserted: %s\n", ch.Slug)
			}
			continue
		}
		fmt.Printf("  upserted: %s\n", ch.Slug)
	}

	fmt.Println("Done.")
}
