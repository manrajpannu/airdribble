package server

import (
	"github.com/gin-gonic/gin"
)

// getHealth godoc
// @Summary Check health of the API
// @Description returns ok if the API is running
// @Tags System
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Router /api/v1/health [get]
func (app *Application) getHealth(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok"})
}
