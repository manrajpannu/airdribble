package server

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// getRanks retrieves all ranks from the database
//
// @Summary Get all ranks
// @Description Retrieve a list of all ranks
// @Tags ranks
// @Accept json
// @Produce json
// @Success 200 {array} []database.Rank
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
// @Description Retrieve a specific rank using its ID
// @Tags ranks
// @Accept json
// @Produce json
// @Param id query int true "Rank ID"
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
