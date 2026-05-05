package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/manrajpannu/airdribble/apps/api/internal/database"
)

// PublicGuestUser is a safe view of GuestUser without the token/IP address
type PublicGuestUser struct {
	ID          int     `json:"id"`
	Username    string  `json:"username"`
	RankID      *int    `json:"rank_id"`
	Location    *string `json:"location"`
	GamesPlayed int     `json:"games_played"`
	Shots       int     `json:"shots"`
	Kills       int     `json:"kills"`
	CreatedAt   *string `json:"created_at"`
}

// getPublicProfile returns a player's public profile by username
func (app *Application) getPublicProfile(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username is required"})
		return
	}

	user, err := app.models.GuestUser.GetByUsername(username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, PublicGuestUser{
		ID:          user.ID,
		Username:    user.Username,
		RankID:      user.RankID,
		Location:    user.Location,
		GamesPlayed: user.GamesPlayed,
		Shots:       user.Shots,
		Kills:       user.Kills,
		CreatedAt:   user.CreatedAt,
	})
}

// getPublicUserActivity returns the last 90 days of activity heatmap for a player
func (app *Application) getPublicUserActivity(c *gin.Context) {
	username := c.Param("username")

	user, err := app.models.GuestUser.GetByUsername(username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	activity, err := app.models.ChallengeSession.GetActivity(user.Token, 90)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activity"})
		return
	}

	c.JSON(http.StatusOK, activity)
}

// getPublicUserActivityFeed returns paginated milestone activity for a player
func (app *Application) getPublicUserActivityFeed(c *gin.Context) {
	username := c.Param("username")

	user, err := app.models.GuestUser.GetByUsername(username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
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

	feed, err := app.models.UserActivity.GetFeed(user.Token, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activity feed"})
		return
	}

	if feed == nil {
		feed = make([]*database.UserActivity, 0)
	}

	c.JSON(http.StatusOK, feed)
}
