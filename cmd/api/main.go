package main

import (
	"crawler_bacen/internal/server"
	"fmt"
)

func main() {
	httpServer := server.NewServer()

	err := httpServer.ListenAndServe()
	if err != nil {
		panic(fmt.Sprintf("cannot start server: %s", err))
	}
}
