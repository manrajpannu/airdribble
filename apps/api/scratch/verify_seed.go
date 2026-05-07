package main

import (
	"database/sql"
	"fmt"
	"log"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

func main() {
	db, err := sql.Open("libsql", "file:./data.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	rows, err := db.Query("SELECT slug, title FROM challenges")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("Challenges in DB:")
	for rows.Next() {
		var slug, title string
		if err := rows.Scan(&slug, &title); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("- %s: %s\n", slug, title)
	}
}
