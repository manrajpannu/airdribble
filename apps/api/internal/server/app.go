package server

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/manrajpannu/airdribble/apps/api/docs"

	"github.com/manrajpannu/airdribble/apps/api/internal/database"
	"github.com/manrajpannu/airdribble/apps/api/internal/env"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	_ "modernc.org/sqlite"
)

// @title RL-Dart API
// @version 1.0
// @description This is the API documentation for the RL-Dart application.

type Application struct {
	port              int
	jwtSecret         string
	models            database.Models
	challengeDuration time.Duration
	userDuration      time.Duration
	cookieSecure      bool
}

func NewApp() *Application {
	dbUrl := env.GetEnvString("DB_URL", "file:./data.db")
	db, err := sql.Open("libsql", dbUrl)
	if err != nil {
		log.Fatal(err)
	}

	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		log.Fatal(err)
	}

	models := database.NewModels(db)
	app := &Application{
		port:              env.GetEnvInt("PORT", 8080),
		jwtSecret:         env.GetEnvString("JWT_SECRET", "defaultsecret"),
		challengeDuration: env.GetEnvDuration("CHALLENGE_DURATION", 5*time.Minute),
		cookieSecure:      env.GetEnvString("ENV", "development") == "production",
		userDuration:      env.GetEnvDuration("USER_TOKEN_DURATION", 24*7*time.Hour),
		models:            models,
	}

	return app
}
