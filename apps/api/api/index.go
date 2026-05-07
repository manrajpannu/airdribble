package handler

import (
	"net/http"
	"github.com/manrajpannu/airdribble/apps/api/internal/server"
)

var appInstance *server.Application

func init() {
	appInstance = server.NewApp()
}

// Handler is the entry point for Vercel's Go runtime
func Handler(w http.ResponseWriter, r *http.Request) {
	// We use the already configured Gin engine from Routes()
	appInstance.Routes().ServeHTTP(w, r)
}
