package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// getActiveUsersCount returns the total number of active users in the last 2 minutes
//
// @Summary Get active users count
// @Description Returns the total number of unique users who have made a request to the API within the last 2 minutes.
// @Tags stats
// @Produce json
// @Success 200 {object} map[string]int "Total active users"
// @Router /api/v1/stats/active [get]
func (app *Application) getActiveUsersCount(c *gin.Context) {
	count := app.activeTracker.GetActiveCount()
	c.JSON(http.StatusOK, gin.H{
		"active_users": count,
	})
}

// checkUserActiveStatus checks if a specific username is currently active
//
// @Summary Check if a user is active
// @Description Checks if the specified player has pinged the backend within the last 2 minutes.
// @Tags stats
// @Param username path string true "Username to check"
// @Produce json
// @Success 200 {object} map[string]interface{} "User active status"
// @Failure 400 {object} map[string]string "Username is required"
// @Failure 404 {object} map[string]string "User not found"
// @Router /api/v1/users/{username}/active [get]
func (app *Application) checkUserActiveStatus(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username is required"})
		return
	}

	// Fetch user to get their token
	user, err := app.models.GuestUser.GetByUsername(username)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	active := app.activeTracker.IsActive(user.Token)
	c.JSON(http.StatusOK, gin.H{
		"username": username,
		"active":   active,
	})
}
