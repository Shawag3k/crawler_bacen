package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Server is up and running!")
	})

	http.HandleFunc("/start-crawl", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Recebendo solicitação para iniciar o crawling...")

		var requestData map[string]string
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			log.Println("Erro ao ler o corpo da solicitação:", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		if err := json.Unmarshal(body, &requestData); err != nil {
			log.Println("Erro ao deserializar JSON:", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		log.Println("Dados recebidos para o crawling:", requestData)

		requestDataJSON, err := json.Marshal(requestData)
		if err != nil {
			log.Println("Erro ao serializar dados de solicitação para JSON:", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		resp, err := http.Post("http://typescript_crawler:3000/start-crawl", "application/json", bytes.NewBuffer(requestDataJSON))
		if err != nil {
			log.Println("Erro ao enviar solicitação ao crawler:", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		respBody, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Println("Erro ao ler resposta do crawler:", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		log.Println("Resposta recebida do crawler:", string(respBody))

		var responseMap map[string]interface{}
		if err := json.Unmarshal(respBody, &responseMap); err != nil {
			log.Println("Erro ao deserializar resposta do crawler:", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		responseJSON, err := json.Marshal(responseMap)
		if err != nil {
			log.Println("Erro ao serializar resposta para JSON:", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write(responseJSON)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Iniciando o servidor na porta", port)
	http.ListenAndServe(":"+port, nil)
}
