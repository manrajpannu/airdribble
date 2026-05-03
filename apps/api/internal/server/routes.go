package server

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/manrajpannu/airdribble/apps/api/internal/env"
	"github.com/manrajpannu/airdribble/apps/api/internal/middleware"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func (app *Application) Routes() http.Handler {
	g := gin.Default()

	// CORS — read allowed origins from env, default to localhost for dev
	allowedOriginsEnv := env.GetEnvString("ALLOWED_ORIGINS", "http://localhost:3000")
	allowedOrigins := strings.Split(allowedOriginsEnv, ",")

	g.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true, // Required for cookies (user_token, session_token)
		MaxAge:           12 * time.Hour,
	}))
	globalLimiter := middleware.NewRateLimiter(60, 1*time.Minute)
	v1 := g.Group("/api/v1", globalLimiter.Middleware())

	// ranks routes
	{
		v1.GET("/ranks", app.getRanks)
		v1.GET("/rank", app.getRank)
	}

	// challenge routes
	{
		v1.GET("/challenges", app.getChallenges)
		v1.GET("/challenge", app.getChallenge)
	}

	// users — guest creation has an additional strict limiter (3 per hour)
	guestLimiter := middleware.NewRateLimiter(3, 1*time.Hour)
	{
		v1.POST("/users/guest", guestLimiter.Middleware(), app.createGuestUser)
		v1.GET("/users/me", app.getMe)
		v1.PATCH("/users/me", app.updateGuestUser)
	}

	// challenge session
	{
		v1.POST("/challenges/:challenge_id/session", app.createChallengeSession)
		v1.PATCH("/challenges/session/end", app.endChallengeSession)
	}

	// user scores
	{
		v1.GET("/me/scores", app.getUserScores)
		v1.GET("/me/best-score", app.getUserBestScore)
		v1.GET("/me/percentile", app.calculateUserPercentile)
	}

	// leaderboard
	{
		v1.GET("/leaderboard", app.getLeaderboard)
	}
	g.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return g
}
