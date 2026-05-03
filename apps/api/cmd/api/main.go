package main

import (
	"log"

	"github.com/manrajpannu/airdribble/apps/api/internal/server"
)

func main() {
	app := server.NewApp()
	if err := app.Serve(); err != nil {
		log.Fatal(err)
	}
}
