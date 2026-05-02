package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/manrajpannu/rl-dart-api/internal/auth"
	"github.com/manrajpannu/rl-dart-api/internal/database"
)

// createGuestUser creates a guest user account in the database and returns a token
//
// @Summary Create a guest user and returns a token
// @Description creates a guest user account in the database and returns a token
// @Tags users
// @Accept json
// @Produce json
// @Param guest_user body database.GuestUser true "Guest user info"
// @Success 201 {object} map[string]string
// @Router /api/v1/users/guest [post]
func (app *Application) createGuestUser(c *gin.Context) {
	var guest_user database.GuestUser

	if err := c.ShouldBindJSON(&guest_user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := auth.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	guest_user.IPAddress = c.ClientIP()
	guest_user.Token = token

	err = app.models.GuestUser.Insert(&guest_user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create guest user"})
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
		"message": "guest user created",
	})
}

// getUserScores returns all scores for the authenticated user for a challenge
//
// @Summary Get scores for current user
// @Description Retrieve all scores for the authenticated user for a given challenge
// @Tags scores
// @Accept json
// @Produce json
// @Param challenge_id query int true "Challenge ID"
// @Success 200 {array} []database.Score
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

// getUserBestScore returns the best score for the authenticated user for a challenge
//
// @Summary Get best score for current user
// @Description Retrieve the best score for the authenticated user for a given challenge
// @Tags scores
// @Accept json
// @Produce json
// @Param challenge_id query int true "Challenge ID"
// @Success 200 {object} database.Score
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

// calculateUserPercentile returns the percentile rank for the authenticated user for a challenge
//
// @Summary Get percentile rank for current user
// @Description Retrieve the percentile rank for the authenticated user for a given challenge
// @Tags scores
// @Accept json
// @Produce json
// @Param challenge_id query int true "Challenge ID"
// @Success 200 {object} map[string]float64
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
