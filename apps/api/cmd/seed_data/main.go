package main

import (
	crand "crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"math"
	"math/big"
	mrand "math/rand"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	_ "modernc.org/sqlite"
)

func generateToken() string {
	b := make([]byte, 32)
	crand.Read(b)
	return hex.EncodeToString(b)
}

func randomInt(max int) int {
	if max <= 0 {
		return 0
	}
	n, _ := crand.Int(crand.Reader, big.NewInt(int64(max)))
	return int(n.Int64())
}

var adjectives = []string{"Musty", "Squishy", "Turbopolsa", "Kaydop", "GarrettG", "JSTN", "Sypical", "Firstkiller", "MonkeyMoon", "M0nkey", "Alpha54", "FairyPeak", "ScrubKilla", "AppJack", "Rise", "Vatira", "Joyo", "Atomic", "Daniel", "BeastMode", "Comm", "Mist", "Sypical", "Arsenal", "Retals", "Gyro", "AyyJayy"}
var nouns = []string{"Flick", "DoubleTap", "Reset", "CeilingShot", "Pinch", "Save", "Goal", "Demo", "Boost", "Rotation", "Kickoff", "Aerial", "Dribble", "PowerShot", "FiftyFifty", "Fake", "Shadow", "Challenge", "WaveDash", "HalfFlip"}

func generateUsername() string {
	return adjectives[randomInt(len(adjectives))] + nouns[randomInt(len(nouns))] + fmt.Sprintf("%d", randomInt(100000))
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

	if len(os.Args) > 1 && os.Args[1] == "clean" {
		fmt.Println("Cleaning all user data...")
		tables := []string{"user_activity", "leaderboards", "scores", "challenge_sessions", "guest_users"}
		for _, table := range tables {
			_, err := db.Exec(fmt.Sprintf("DELETE FROM %s", table))
			if err != nil {
				log.Printf("Failed to clean table %s: %v", table, err)
			}
		}
		fmt.Println("Done cleaning.")
		return
	}

	// Get Ranks and Challenges
	var rankIDs []int
	rows, _ := db.Query("SELECT id FROM ranks")
	for rows.Next() {
		var id int
		rows.Scan(&id)
		rankIDs = append(rankIDs, id)
	}
	rows.Close()

	var challengeIDs []int
	rows, _ = db.Query("SELECT id FROM challenges")
	for rows.Next() {
		var id int
		rows.Scan(&id)
		challengeIDs = append(challengeIDs, id)
	}
	rows.Close()

	if len(rankIDs) == 0 || len(challengeIDs) == 0 {
		log.Fatal("Ranks or Challenges missing. Run migrations/initial seed first.")
	}

	fmt.Printf("Starting massive seed: 1000 users, 100k activities, 1M sessions...\n")

	tx, err := db.Begin()
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < 1000; i++ {
		username := generateUsername()
		token := generateToken()
		rankID := rankIDs[randomInt(len(rankIDs))]
		
		_, err = tx.Exec("INSERT INTO guest_users (username, token, rank_id) VALUES (?, ?, ?)", username, token, rankID)
		if err != nil {
			log.Fatal(err)
		}

		// 100 activities per user
		for j := 0; j < 100; j++ {
			cID := challengeIDs[randomInt(len(challengeIDs))]
			score := int(math.Max(0, mrand.NormFloat64()*200+500))
			_, err = tx.Exec("INSERT INTO user_activity (user_token, type, challenge_id, score) VALUES (?, ?, ?, ?)", 
				token, "session_end", cID, score)
		}

		// 1000 sessions per user in the past week
		now := time.Now()
		for j := 0; j < 1000; j++ {
			cID := challengeIDs[randomInt(len(challengeIDs))]
			sToken := generateToken()
			// Random time in last 7 days
			offset := time.Duration(randomInt(7*24*60*60)) * time.Second
			startedAt := now.Add(-offset)
			
			_, err = tx.Exec("INSERT INTO challenge_sessions (user_token, challenge_id, session_token, started_at, ended_at, used) VALUES (?, ?, ?, ?, ?, 1)", 
				token, cID, sToken, startedAt.Format("2006-01-02 15:04:05"), startedAt.Add(time.Minute).Format("2006-01-02 15:04:05"))
		}

		// Best scores for each challenge (Bell Curve)
		for _, cID := range challengeIDs {
			// Normal distribution: Mean 700, StdDev 200
			score := int(math.Max(0, mrand.NormFloat64()*200+700))
			sToken := generateToken()
			
			// Add to scores table
			_, _ = tx.Exec("INSERT INTO scores (user_token, session_token, challenge_id, score, shots, kills) VALUES (?, ?, ?, ?, ?, ?)", 
				token, sToken, cID, score, score/10, score/20)

			// Add to leaderboard
			_, _ = tx.Exec("INSERT INTO leaderboards (user_token, session_token, challenge_id, score) VALUES (?, ?, ?, ?)", 
				token, sToken, cID, score)
		}

		if (i+1)%50 == 0 {
			fmt.Printf("Processed %d users...\n", i+1)
			err = tx.Commit()
			if err != nil {
				log.Fatal(err)
			}
			tx, _ = db.Begin()
		}
	}

	err = tx.Commit()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Massive seeding complete!")
}
