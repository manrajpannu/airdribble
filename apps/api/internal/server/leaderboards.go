package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// getLeaderboard returns the leaderboard for a challenge
//
// @Summary Get the leaderboard for a challenge
// @Description Returns a ranked list of the top players for a specific challenge, ordered by best score descending. Each entry contains the player's username, their best score, and their Rocket League rank. Use this to display the challenge leaderboard and show where the current user stands relative to others.
// @Tags leaderboards
// @Produce json
// @Param challenge_id query int true "Unique challenge ID to fetch the leaderboard for" example(1)
// @Success 200 {array} map[string]interface{} "Ranked leaderboard entries for the given challenge"
// @Failure 400 {object} map[string]string "Invalid or non-numeric challenge_id provided"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
// @Router /api/v1/leaderboard [get]
func (app *Application) getLeaderboard(c *gin.Context) {
	challengeID, err := strconv.Atoi(c.Query("challenge_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	leaderboard, err := app.models.Leaderboard.Get(challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, leaderboard)
}
