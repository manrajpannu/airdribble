package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	_ "github.com/manrajpannu/airdribble/apps/api/internal/database"
)

// getRanks retrieves all ranks from the database
//
// @Summary List all Rocket League ranks
// @Description Returns the full list of all Rocket League ranks seeded in the database, ordered from Bronze I to Supersonic Legend. Use this to populate the rank selection dropdown on the user profile page. Each rank has a tier name (e.g. "Diamond"), a tier number (1–3), and a division (1–4).
// @Tags ranks
// @Produce json
// @Success 200 {array} database.Rank "Full list of Rocket League ranks"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
// @Router /api/v1/ranks [get]
func (app *Application) getRanks(c *gin.Context) {
	ranks, err := app.models.Rank.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ranks"})
		return
	}

	c.JSON(http.StatusOK, ranks)
}

// getRank retrieves a specific rank by ID
//
// @Summary Get a rank by ID
// @Description Returns a single Rocket League rank by its unique numeric ID. Returns 404 if the rank does not exist. Rank IDs are stable — they are seeded in order from Bronze I (id=1) to Supersonic Legend (id=87).
// @Tags ranks
// @Produce json
// @Param id query int true "Unique rank ID" example(51)
// @Success 200 {object} database.Rank "Rank found"
// @Failure 400 {object} map[string]string "Invalid or non-numeric rank ID provided"
// @Failure 404 {object} map[string]string "No rank found with the given ID"
// @Failure 500 {object} map[string]string "Internal server error — database query failed"
// @Router /api/v1/rank [get]
func (app *Application) getRank(c *gin.Context) {
	id, err := strconv.Atoi(c.Query("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rank ID"})
		return
	}

	rank, err := app.models.Rank.Get(id)

	if rank == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rank not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rank"})
		return
	}

	c.JSON(http.StatusOK, rank)

}
