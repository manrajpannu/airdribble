package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// getLeaderboard returns the leaderboard for a challenge
//
// @Summary Get challenge leaderboard
// @Description Retrieve the global leaderboard for a specific challenge
// @Tags leaderboards
// @Accept json
// @Produce json
// @Param challenge_id query int true "Challenge ID"
// @Success 200 {array} []map[string]interface{}
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
