package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// getChallenges retrieves all challenges from the database
//
// @Summary Get all challenges
// @Description Retrieve a list of all challenges
// @Tags challenges
// @Accept json
// @Produce json
// @Success 200 {array} []database.Challenge
// @Router /api/v1/challenges [get]
func (app *Application) getChallenges(c *gin.Context) {
	challenges, err := app.models.Challenge.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch challenges"})
		return
	}

	c.JSON(http.StatusOK, challenges)
}

// getChallenge retrieves a specific challenge by ID
//
// @Summary Get a challenge by ID
// @Description Retrieve a specific challenge using its ID
// @Tags challenges
// @Accept json
// @Produce json
// @Param id query int true "Challenge ID"
// @Router /api/v1/challenge [get]
func (app *Application) getChallenge(c *gin.Context) {
	id, err := strconv.Atoi(c.Query("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	challenge, err := app.models.Challenge.Get(id)

	if challenge == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch challenge"})
		return
	}

	c.JSON(http.StatusOK, challenge)
}
