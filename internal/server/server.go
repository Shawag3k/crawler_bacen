package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"
)

type Server struct {
	port int
}

func NewServer() *http.Server {
	port, _ := strconv.Atoi(os.Getenv("PORT"))
	srv := &Server{
		port: port,
	}

	// Configuração do servidor
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", srv.port),
		Handler:      srv.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return server
}

func (s *Server) RegisterRoutes() http.Handler {
	r := gin.Default()

	r.GET("/", s.HelloWorldHandler)
	r.GET("/health", s.healthHandler)
	r.POST("/start-crawl", s.StartCrawlHandler)

	return r
}

func (s *Server) HelloWorldHandler(c *gin.Context) {
	resp := make(map[string]string)
	resp["message"] = "Hello World"

	c.JSON(http.StatusOK, resp)
}

func (s *Server) healthHandler(c *gin.Context) {
	resp := make(map[string]string)
	resp["status"] = "ok"

	c.JSON(http.StatusOK, resp)
}

func (s *Server) StartCrawlHandler(c *gin.Context) {
	var requestData map[string]string

	if err := c.BindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert requestData to JSON string
	requestDataJSON, err := json.Marshal(requestData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Criar o comando para executar o Crawlee
	cmd := exec.Command("node", "internal/automation/src/crawlee_worker.js")
	cmd.Env = append(os.Environ(), fmt.Sprintf("CRAWL_DATA=%s", requestDataJSON))
	output, err := cmd.CombinedOutput()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "output": string(output)})
		return
	}

	var links []string
	if err := json.Unmarshal(output, &links); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse output", "output": string(output)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"links": links})
}
