package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (srv *Server) RegisterRoutes() http.Handler {
	r := gin.Default()

	r.GET("/", srv.HelloWorldHandler)
	r.GET("/health", srv.healthHandler)
	r.POST("/start-crawl", srv.StartCrawlHandler)

	return r
}

func (srv *Server) HelloWorldHandler(c *gin.Context) {
	resp := map[string]string{"message": "Hello World"}
	c.JSON(http.StatusOK, resp)
}

func (srv *Server) healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, srv.db.Health())
}

func (srv *Server) StartCrawlHandler(c *gin.Context) {
	// Implementar a lógica para iniciar o crawler TypeScript
	// Pode ser feita uma chamada HTTP para o serviço em TypeScript
}
