package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Server is up and running!")
	})

	http.HandleFunc("/start-crawl", func(w http.ResponseWriter, r *http.Request) {
		var requestData map[string]string
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		if err := json.Unmarshal(body, &requestData); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		requestDataJSON, err := json.Marshal(requestData)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		resp, err := http.Post("http://typescript_crawler:3000/start-crawl", "application/json", bytes.NewBuffer(requestDataJSON))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		respBody, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var responseMap map[string]interface{}
		if err := json.Unmarshal(respBody, &responseMap); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Verificando e corrigindo o campo "pdfs_gerados"
		var savedFiles []string
		if pdfs, ok := responseMap["pdfs_gerados"].([]interface{}); ok {
			for _, pdf := range pdfs {
				if pdfName, ok := pdf.(string); ok {
					savedFiles = append(savedFiles, filepath.Base(pdfName))
				}
			}
		}

		responseMap["pdfs_gerados"] = savedFiles

		// Respondendo ao cliente com os detalhes dos arquivos PDF
		w.Header().Set("Content-Type", "application/json")
		responseJSON, err := json.Marshal(responseMap)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write(responseJSON)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.ListenAndServe(":"+port, nil)
}
