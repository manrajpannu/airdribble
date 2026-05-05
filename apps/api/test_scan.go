package main

import (
	"database/sql"
	"fmt"
	_ "modernc.org/sqlite"
)

func main() {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil { panic(err) }
	_, err = db.Exec("CREATE TABLE test (id INT, rank_id INT)")
	if err != nil { panic(err) }
	_, err = db.Exec("INSERT INTO test (id, rank_id) VALUES (1, 12)")
	if err != nil { panic(err) }
	
	var rankID *int
	err = db.QueryRow("SELECT rank_id FROM test WHERE id = 1").Scan(&rankID)
	fmt.Println("Err:", err)
	if rankID != nil {
		fmt.Println("RankID:", *rankID)
	}
}
