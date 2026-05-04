package server

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/manrajpannu/airdribble/apps/api/internal/auth"
	"github.com/manrajpannu/airdribble/apps/api/internal/database"
)

// createChallengeSession starts a new challenge attempt for the authenticated user
//
// @Summary Start a challenge session
// @Description Creates a new challenge session for the currently authenticated guest user. This must be called before the user starts a challenge attempt. On success, a short-lived `session_token` cookie is set (default 1 hour) which is required to submit a score when the session ends. Requires an active `user_token` cookie. The challenge must exist and be active.
// @Tags challenge_sessions
// @Produce json
// @Param challenge_id path int true "ID of the challenge to begin a session for" example(1)
// @Success 201 {object} map[string]string "Session created successfully — session_token cookie is set"
// @Failure 400 {object} map[string]string "Invalid challenge ID, challenge does not exist, or missing user_token cookie"
// @Failure 500 {object} map[string]string "Internal server error — failed to generate session token or write to database"
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

// endChallengeSession ends an active session and submits the player's score
//
// @Summary End a challenge session and submit score
// @Description Marks an active challenge session as complete and saves the player's final score. This endpoint validates both the `user_token` and `session_token` cookies to prevent score manipulation. After saving the score, it automatically updates the leaderboard if the new score is the user's personal best. The `session_token` cookie is cleared on success. Requires both `user_token` and `session_token` cookies to be present.
// @Tags challenge_sessions
// @Accept json
// @Produce json
// @Param score body database.Score true "The player's final score for the challenge attempt"
// @Success 200 {object} map[string]string "Session ended and score saved successfully"
// @Failure 400 {object} map[string]string "Missing user_token or session_token cookie, or invalid score payload"
// @Failure 500 {object} map[string]string "Internal server error — failed to end session, save score, or update leaderboard"
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

	// Update cumulative user stats
	err = app.models.GuestUser.IncrementStats(userToken, score.Shots, score.Kills)
	if err != nil {
		// Log error but don't fail the request since score is already saved
		log.Printf("Failed to update user cumulative stats: %v", err)
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

		// Insert activity for first score
		err = app.models.UserActivity.Insert(userToken, score.ChallengeID, score.Score)
		if err != nil {
			fmt.Printf("Error inserting high score activity: %v\n", err)
		}
	} else if score.Score > leaderboard_score.Score {
		err = app.models.Leaderboard.Update(&score)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update leaderboard entry"})
			return
		}

		// Insert activity for high score
		err = app.models.UserActivity.Insert(userToken, score.ChallengeID, score.Score)
		if err != nil {
			// Log error but don't fail the request
			fmt.Printf("Error inserting high score activity: %v\n", err)
		}
	}
	// Respond success
	c.JSON(http.StatusOK, gin.H{
		"message":       "Session ended and Score saved",
		"session_token": sessionToken,
		"score":         score.Score,
		"shots":         score.Shots,
		"kills":         score.Kills,
	})
}

// getUserActivity returns the last 90 days of session activity for the user
//
// @Summary Get user activity heatmap data
// @Description Returns a list of daily session counts for the last 90 days, including a mapped intensity level (0-4) for heatmap visualization. Authentication is via the `user_token` HttpOnly cookie.
// @Tags users
// @Produce json
// @Success 200 {array} database.ActivityRecord "List of daily activity records"
// @Failure 400 {object} map[string]string "Missing user_token cookie"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
// @Router /api/v1/me/activity [get]
func (app *Application) getUserActivity(c *gin.Context) {
	userToken, err := c.Cookie("user_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_token cookie"})
		return
	}

	activity, err := app.models.ChallengeSession.GetActivity(userToken, 90)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user activity"})
		return
	}

	c.JSON(http.StatusOK, activity)
}
