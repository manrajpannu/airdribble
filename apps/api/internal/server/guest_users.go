package server

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/manrajpannu/airdribble/apps/api/internal/auth"
	"github.com/manrajpannu/airdribble/apps/api/internal/database"
)

// createGuestUser creates a zero-friction anonymous account on first site visit
//
// @Summary Create a guest user account
// @Description Instantly creates an anonymous guest account with no sign-up required. No request body needed. A believable, gamer-style random username (e.g. "SlyPigeon99" or "NeonShadow") and a secure 64-character hex identity token are generated automatically. The token is set as an HttpOnly `user_token` cookie valid for 7 days. All challenge scores are tied to this identity — calling this endpoint again creates a fresh guest account.
// @Tags users
// @Produce json
// @Success 201 {object} map[string]string "Guest account created — user_token cookie is set"
// @Failure 500 {object} map[string]string "Internal server error — failed to generate token or write to database"
// @Router /api/v1/users/guest [post]
func (app *Application) createGuestUser(c *gin.Context) {
	var guest_user database.GuestUser

	// No request body is required or allowed for guest creation

	token, err := auth.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	ip := c.ClientIP()
	guest_user.IPAddress = &ip
	guest_user.Token = token

	// Attempt to find a unique username (max 5 retries)
	success := false
	for i := 0; i < 5; i++ {
		guest_user.Username = auth.GenerateRandomName()

		err = app.models.GuestUser.Insert(&guest_user)
		if err == nil {
			success = true
			break
		}

		// If it's a unique constraint violation on username, retry
		if strings.Contains(err.Error(), "UNIQUE constraint failed: guest_users.username") {
			continue
		}

		// Other DB errors should fail immediately
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create guest user"})
		return
	}

	if !success {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate unique username"})
		return
	}

	c.SetCookie(
		"user_token",
		token,
		int(app.userDuration.Seconds()),
		"/",
		"",
		app.cookieSecure,
		true,
	)
	c.JSON(http.StatusCreated, gin.H{
		"message":  "guest user created",
		"username": guest_user.Username,
	})
}

// getMe returns the current authenticated user's profile
//
// @Summary Get current user profile
// @Description Retrieve the profile information for the currently authenticated user based on their user_token cookie. Returns their username, current rank, and account metadata.
// @Tags users
// @Produce json
// @Success 200 {object} database.GuestUser "User profile found"
// @Failure 400 {object} map[string]string "Missing user_token cookie"
// @Failure 404 {object} map[string]string "User not found"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
// @Router /api/v1/users/me [get]
func (app *Application) getMe(c *gin.Context) {
	userToken, err := c.Cookie("user_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_token cookie"})
		return
	}

	user, err := app.models.GuestUser.GetByToken(userToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// getUserScores returns all historical scores for the authenticated user on a challenge
//
// @Summary Get all scores for the current user
// @Description Returns every recorded score for the authenticated user on a specific challenge, ordered by most recent first. Use this to display a score history graph or replay timeline. Authentication is via the `user_token` HttpOnly cookie. Requires a valid `challenge_id` query parameter.
// @Tags scores
// @Produce json
// @Param challenge_id query int true "ID of the challenge to retrieve scores for" example(1)
// @Success 200 {array} database.Score "All recorded scores for this user on the given challenge"
// @Failure 400 {object} map[string]string "Missing user_token cookie or invalid challenge_id"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
// @Router /api/v1/me/scores [get]
func (app *Application) getUserScores(c *gin.Context) {
	userToken, err := c.Cookie("user_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_token cookie"})
		return
	}

	challenge_id, err := strconv.Atoi(c.Query("challenge_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	scores, err := app.models.Score.GetAll(userToken, challenge_id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user scores"})
		return
	}
	c.JSON(http.StatusOK, scores)
}

// getUserBestScore returns the user's all-time best score for a challenge
//
// @Summary Get current user's personal best score
// @Description Returns the single highest score achieved by the authenticated user for the given challenge. This is the score used for the leaderboard. Returns null/empty if the user has not yet completed the challenge. Authentication is via the `user_token` HttpOnly cookie.
// @Tags scores
// @Produce json
// @Param challenge_id query int true "ID of the challenge to retrieve the best score for" example(1)
// @Success 200 {object} database.Score "The user's personal best score entry for this challenge"
// @Failure 400 {object} map[string]string "Missing user_token cookie or invalid challenge_id"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
// @Router /api/v1/me/best-score [get]
func (app *Application) getUserBestScore(c *gin.Context) {
	userToken, err := c.Cookie("user_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_token cookie"})
		return
	}

	challenge_id, err := strconv.Atoi(c.Query("challenge_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	score, err := app.models.Leaderboard.GetBestScore(userToken, challenge_id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user best scores"})
		return
	}
	c.JSON(http.StatusOK, score)
}

// calculateUserPercentile returns where the user ranks relative to all other players
//
// @Summary Get current user's percentile ranking
// @Description Calculates and returns the user's percentile position (0–100) on the global leaderboard for a specific challenge. A score of 95.0 means the user is in the top 5% of all players. A score of 50.0 means they are exactly at the median. Returns 0.0 if the user has not yet completed the challenge. Authentication is via the `user_token` HttpOnly cookie.
// @Tags scores
// @Produce json
// @Param challenge_id query int true "ID of the challenge to calculate percentile for" example(1)
// @Success 200 {object} map[string]float64 "The user's percentile ranking — e.g. {\"percentile\": 87.5}"
// @Failure 400 {object} map[string]string "Missing user_token cookie or invalid challenge_id"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
// @Router /api/v1/me/percentile [get]
func (app *Application) calculateUserPercentile(c *gin.Context) {
	userToken, err := c.Cookie("user_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_token cookie"})
		return
	}

	challenge_id, err := strconv.Atoi(c.Query("challenge_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	percentile, err := app.models.Leaderboard.CalculatePercentile(userToken, challenge_id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate user percentile"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"percentile": percentile})
}

// updateGuestUser updates a guest user's public display name and Rocket League rank
//
// @Summary Update guest user profile
// @Description Allows a guest user to personalise their profile by setting a custom display name and their Rocket League rank. This converts a "basic guest" into an "improved guest" with a real identity on the leaderboard. Both fields are optional — send only the ones you want to update. Authentication is via the `user_token` HttpOnly cookie. The rank_id must correspond to a valid rank from GET /api/v1/ranks.
// @Tags users
// @Accept json
// @Produce json
// @Param profile body object true "Profile fields to update" example({"username":"RocketKing","rank_id":51})
// @Success 200 {object} map[string]string "Profile updated successfully"
// @Failure 400 {object} map[string]string "Missing user_token cookie or invalid JSON body"
// @Failure 500 {object} map[string]string "Internal server error — database update failed"
// @Router /api/v1/users/me [patch]
func (app *Application) updateGuestUser(c *gin.Context) {
	userToken, err := c.Cookie("user_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_token cookie"})
		return
	}

	var input struct {
		Username *string `json:"username"`
		RankID   *int    `json:"rank_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Fetch current user to preserve values if they aren't provided in the patch
	user, err := app.models.GuestUser.GetByToken(userToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if input.Username != nil {
		trimmed := strings.TrimSpace(*input.Username)
		if trimmed == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username cannot be empty"})
			return
		}
		taken, err := app.models.GuestUser.IsUsernameTaken(trimmed, userToken)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check username"})
			return
		}
		if taken {
			c.JSON(http.StatusConflict, gin.H{"error": "Username is already taken"})
			return
		}
		user.Username = trimmed
	}
	if input.RankID != nil {
		user.RankID = input.RankID
	}

	err = app.models.GuestUser.Update(user)
	if err != nil {
		log.Printf("Error updating guest user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update guest user: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "guest user updated",
	})
}
