package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/manrajpannu/airdribble/apps/api/internal/database"
)

// getUserActivityFeed returns a paginated list of high-score activities for the user
//
// @Summary Get user activity feed
// @Description Returns a paginated list of high-score milestones (first scores or personal bests) achieved by the user.
// @Tags users
// @Produce json
// @Param limit query int false "Number of items to return (default 5)"
// @Param offset query int false "Number of items to skip (default 0)"
// @Success 200 {array} database.UserActivity "List of user activities"
// @Failure 400 {object} map[string]string "Invalid query parameters"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/v1/me/activity/feed [get]
func (app *Application) getUserActivityFeed(c *gin.Context) {
	userToken, err := c.Cookie("user_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_token cookie"})
		return
	}

	limitStr := c.DefaultQuery("limit", "5")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	feed, err := app.models.UserActivity.GetFeed(userToken, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activity feed"})
		return
	}

	if feed == nil {
		feed = make([]*interface{}, 0) // Return empty array instead of null
	}

	c.JSON(http.StatusOK, feed)
}
