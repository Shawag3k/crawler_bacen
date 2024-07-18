// main.go

package main

import (
	"fmt"
	"net/http"
	"os/exec"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Server is up and running!")
	})

	http.HandleFunc("/crawl", func(w http.ResponseWriter, r *http.Request) {
		cmd := exec.Command("curl", "http://typescript_crawler:3000/start_crawl")
		_, err := cmd.CombinedOutput()
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to start crawling: %v", err), http.StatusInternalServerError)
			return
		}

		fmt.Fprintf(w, "Crawling process started successfully!")
	})

	http.ListenAndServe(":8080", nil)
}
