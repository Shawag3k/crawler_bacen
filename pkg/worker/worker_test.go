package worker

import (
	"strings"
	"testing"
)

// TestRunCrawler verifica se o processo de crawling está funcionando
func TestRunCrawler(t *testing.T) {
	links, err := RunCrawler()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(links) == 0 {
		t.Fatalf("Expected some links, got none")
	}

	// Aqui você pode adicionar mais verificações, por exemplo, se os links têm um formato específico
	for _, link := range links {
		if !strings.HasPrefix(link, "http") {
			t.Errorf("Expected link to start with http, got %v", link)
		}
	}
}
