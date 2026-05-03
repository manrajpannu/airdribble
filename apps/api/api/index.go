package handler

import (
	"net/http"

	"github.com/manrajpannu/airdribble/apps/api/internal/server"
)

var app *server.Application

func init() {
	app = server.NewApp()
}

func Handler(w http.ResponseWriter, r *http.Request) {
	app.Routes().ServeHTTP(w, r)
}
