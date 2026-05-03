package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// getChallenges retrieves all challenges from the database
//
// @Summary List all challenges
// @Description Returns a list of all available Airdribble training challenges. Each challenge includes its configuration (targets, duration, seed type), difficulty rating, and active status. Use this to populate the challenge selection screen.
// @Tags challenges
// @Produce json
// @Success 200 {array} database.Challenge "List of challenges"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
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
// @Description Returns a single challenge by its unique numeric ID. Includes the full challenge configuration JSON (target layout, timing, etc.), difficulty, seed type, and active status. Returns 404 if the ID does not exist.
// @Tags challenges
// @Produce json
// @Param id query int true "Unique challenge ID" example(1)
// @Success 200 {object} database.Challenge "Challenge found"
// @Failure 400 {object} map[string]string "Invalid or non-numeric challenge ID provided"
// @Failure 404 {object} map[string]string "No challenge found with the given ID"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
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
