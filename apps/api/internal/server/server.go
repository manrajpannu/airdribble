package server

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

func (app *Application) Serve() error {
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", app.port),
		Handler:      app.Routes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	log.Printf("Starting server on port %d", app.port)
	return server.ListenAndServe()

}
