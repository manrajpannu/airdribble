package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	_ "github.com/manrajpannu/airdribble/apps/api/internal/database"
)

// getChallenges retrieves all active challenges from the database
//
// @Summary List all challenges
// @Description Returns a list of all active challenges ordered by difficulty. Each challenge includes its slug, title, tags, thumbnail, icon, and parsed config object.
// @Tags challenges
// @Produce json
// @Success 200 {array} database.Challenge "List of challenges"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/v1/challenges [get]
func (app *Application) getChallenges(c *gin.Context) {
	challenges, err := app.models.Challenge.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch challenges"})
		return
	}

	c.JSON(http.StatusOK, challenges)
}

// getChallenge retrieves a specific challenge by slug
//
// @Summary Get a challenge by slug
// @Description Returns a single challenge by its unique slug (e.g. "ball-tracking"). Includes the full parsed config object, tags, thumbnail, and icon.
// @Tags challenges
// @Produce json
// @Param slug query string true "Challenge slug" example("ball-tracking")
// @Success 200 {object} database.Challenge "Challenge found"
// @Failure 400 {object} map[string]string "Missing slug parameter"
// @Failure 404 {object} map[string]string "Challenge not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /api/v1/challenge [get]
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
