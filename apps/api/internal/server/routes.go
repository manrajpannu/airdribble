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
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Fingerprint"},
		AllowCredentials: true, // Required for cookies (user_token, session_token)
		MaxAge:           12 * time.Hour,
	}))

	// Tier 1: Public Read (High limit)
	tier1 := middleware.NewTieredLimiter(middleware.TierConfig{
		IPLimit:   200,
		UserLimit: 100,
		Window:    1 * time.Minute,
	}, "Too many requests. Please slow down.")

	// Tier 2: User Data (Moderate)
	tier2 := middleware.NewTieredLimiter(middleware.TierConfig{
		IPLimit:   100,
		UserLimit: 60,
		Window:    1 * time.Minute,
	}, "Too many data requests. Please wait a minute.")

	// Tier 3: Writes / Mutations (Strict)
	tier3 := middleware.NewTieredLimiter(middleware.TierConfig{
		IPLimit:     20,
		UserLimit:   10,
		Window:      1 * time.Minute,
		BurstLimit:  3,
		BurstWindow: 5 * time.Second,
	}, "Too many write operations. Please wait a minute.")

	// Guest Account Abuse Prevention (Strict IP-only limit)
	guestCreationLimiter := middleware.NewTieredLimiter(middleware.TierConfig{
		IPLimit:   3,
		UserLimit: 100, // User limit doesn't really apply for creation, so we set it high
		Window:    1 * time.Hour,
	}, "Too many guest accounts created from this IP. Please wait an hour.")

	v1 := g.Group("/api/v1")
	v1.Use(middleware.TrackActiveUsers(app.activeTracker))

	v1.GET("/health", tier1.Middleware(), app.getHealth)

	// Activity Tracking
	{
		v1.GET("/stats/active", tier1.Middleware(), app.getActiveUsersCount)
		v1.GET("/users/:username/active", tier1.Middleware(), app.checkUserActiveStatus)
	}

	// Tier 1: Ranks & Challenges
	{
		v1.GET("/ranks", tier1.Middleware(), app.getRanks)
		v1.GET("/rank", tier1.Middleware(), app.getRank)
		v1.GET("/challenges", tier1.Middleware(), app.getChallenges)
		v1.GET("/challenge", tier1.Middleware(), app.getChallenge)
	}

	// Tier 1: Leaderboard
	{
		v1.GET("/leaderboard", tier1.Middleware(), app.getLeaderboard)
		v1.GET("/leaderboard/context", tier1.Middleware(), app.getLeaderboardContext)
	}

	// Tier 2: User Data (/me routes)
	{
		v1.GET("/users/me", tier2.Middleware(), app.getMe)
		v1.GET("/me/activity", tier2.Middleware(), app.getUserActivity)
		v1.GET("/me/activity/feed", tier2.Middleware(), app.getUserActivityFeed)
		v1.GET("/me/scores", tier2.Middleware(), app.getUserScores)
		v1.GET("/me/best-score", tier2.Middleware(), app.getUserBestScore)
		v1.GET("/me/percentile", tier2.Middleware(), app.calculateUserPercentile)
	}

	// Tier 3: Writes / Mutations
	{
		v1.POST("/users/guest", tier3.Middleware(), guestCreationLimiter.Middleware(), app.createGuestUser)
		v1.PATCH("/users/me", tier3.Middleware(), app.updateGuestUser)
		v1.POST("/challenges/:challenge_id/session", tier3.Middleware(), app.createChallengeSession)
		v1.PATCH("/challenges/session/end", tier3.Middleware(), app.endChallengeSession)
		v1.POST("/challenges/:challenge_id/rate", tier3.Middleware(), app.rateChallenge)
	}

	// Public profile routes (Tier 1 as they are read-only)
	{
		v1.GET("/users/:username", tier1.Middleware(), app.getPublicProfile)
		v1.GET("/users/:username/activity", tier1.Middleware(), app.getPublicUserActivity)
		v1.GET("/users/:username/activity/feed", tier1.Middleware(), app.getPublicUserActivityFeed)
		v1.GET("/users/:username/ranks", tier1.Middleware(), app.getUserRanks)
		v1.GET("/challenges/:challenge_id/rating", tier1.Middleware(), app.getUserRating)
	}

	g.GET("/swagger/*any", tier1.Middleware(), ginSwagger.WrapHandler(swaggerFiles.Handler))

	return g
}
