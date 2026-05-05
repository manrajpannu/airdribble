package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	_ "github.com/manrajpannu/airdribble/apps/api/internal/database"
)

// getChallenges retrieves all active challenges from the database
func (app *Application) getChallenges(c *gin.Context) {
	challenges, err := app.models.Challenge.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch challenges"})
		return
	}

	c.JSON(http.StatusOK, challenges)
}

// getChallenge retrieves a specific challenge by slug
func (app *Application) getChallenge(c *gin.Context) {
	slug := c.Query("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing slug parameter"})
		return
	}

	challenge, err := app.models.Challenge.Get(slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch challenge"})
		return
	}
	if challenge == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}

	c.JSON(http.StatusOK, challenge)
}

func (app *Application) rateChallenge(c *gin.Context) {
	idStr := c.Param("challenge_id")
	var input struct {
		Rating int `json:"rating"` // 1 for like, -1 for dislike, 0 to remove
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	userToken, err := c.Cookie("user_token")
	if err != nil || userToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err = app.models.ChallengeRating.SetRating(id, userToken, input.Rating)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update rating"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rating updated successfully"})
}

func (app *Application) getUserRating(c *gin.Context) {
	idStr := c.Param("challenge_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	userToken, err := c.Cookie("user_token")
	if err != nil || userToken == "" {
		c.JSON(http.StatusOK, gin.H{"rating": 0})
		return
	}

	rating, err := app.models.ChallengeRating.GetUserRating(id, userToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rating"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"rating": rating})
}
