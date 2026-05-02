package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/manrajpannu/rl-dart-api/internal/auth"
	"github.com/manrajpannu/rl-dart-api/internal/database"
)

// @Summary Start a new challenge session
// @Description Starts a new session for a challenge and returns the session token
// @Tags challenge_sessions
// @Accept json
// @Produce json
// @Param challenge_id path int true "ID of the challenge to start a session for"
// @Success 201 {object} gin.H "Session successfully created"
// @Failure 400 {object} gin.H "Invalid challenge ID, Challenge ID does not exist, or Missing user_token cookie"
// @Failure 500 {object} gin.H "Database error or Failed to generate token/create challenge session"
// @Router /api/v1/challenges/{challenge_id}/session [post]
func (app *Application) createChallengeSession(c *gin.Context) {

	// Parse challenge ID from URL
	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.Atoi(challengeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	// Bind User info from request body
	userToken, err := c.Cookie("user_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_token cookie"})
		return
	}

	// Check if challenge_id exists
	exists, err := app.models.Challenge.Exists(challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Challenge ID does not exist"})
		return
	}

	// Generate session token
	sessionToken, err := auth.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// You would create the challenge session here, e.g.:
	err = app.models.ChallengeSession.Insert(userToken, challengeID, sessionToken)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create challenge session"})
		return
	}

	c.SetCookie(
		"session_token",                      // name
		sessionToken,                         // value
		int(app.challengeDuration.Seconds()), // maxAge (5 minutes in seconds)
		"/",                                  // path
		"",                                   // domain ("" = localhost OK)
		app.cookieSecure,                     // secure (false for localhost)
		true,                                 // httpOnly
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "challenge session created",
	})

}

// @Summary End a challenge session
// @Description Marks a challenge session as completed
// @Tags challenge_sessions
// @Accept json
// @Produce json
// @Param score body database.Score true "Score information"
// @Router /api/v1/challenges/session/end [patch]
func (app *Application) endChallengeSession(c *gin.Context) {

	// Get cookies
	userToken, err := c.Cookie("user_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_token cookie"})
		return
	}

	sessionToken, err := c.Cookie("session_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing session_token cookie"})
		return
	}

	// Get challenge ID from session
	challengeID, err := app.models.ChallengeSession.GetChallengeID(&userToken, &sessionToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch challenge session"})
		return
	}

	// Bind score from request body
	var score database.Score
	if err := c.ShouldBindJSON(&score); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	score.UserToken = userToken
	score.SessionToken = sessionToken
	score.ChallengeID = challengeID

	// End session
	err = app.models.ChallengeSession.End(userToken, sessionToken, app.challengeDuration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to end challenge session"})
		c.SetCookie("session_token", "", -1, "/", "", app.cookieSecure, true)
		return
	}
	c.SetCookie("session_token", "", -1, "/", "", app.cookieSecure, true)

	// Save score
	err = app.models.Score.Insert(&score)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save score"})
		return
	}

	leaderboard_score, err := app.models.Leaderboard.GetBestScore(userToken, challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	// Create or Update leaderboard entry
	if leaderboard_score == nil {
		err = app.models.Leaderboard.Insert(&score)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create leaderboard entry"})
			return
		}
	} else if score.Score > leaderboard_score.Score {
		err = app.models.Leaderboard.Update(&score)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update leaderboard entry"})
			return
		}
	}

	// Respond success
	c.JSON(http.StatusOK, gin.H{
		"message":       "Session ended and Score saved",
		"session_token": sessionToken,
	})
}
