package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func (app *Application) Routes() http.Handler {
	g := gin.Default()

	v1 := g.Group("/api/v1")

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

	// users
	{
		v1.POST("/users/guest", app.createGuestUser)
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
