package main

import (
	"crawler_bacen/internal/server"
	"log"
)

func main() {
	srv := server.NewServer()
	err := srv.ListenAndServe()
	if err != nil {
		log.Fatalf("cannot start server: %s", err)
	}
}
