package worker

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"time"
)

// Configuração para o comando Node.js
const scriptPath = "./internal/automation/crawlee_worker.js"

// RunCrawler inicia o processo de crawling
func RunCrawler() ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	cmd := exec.CommandContext(ctx, "node", scriptPath)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("error running crawlee script: %v\n%s", err, out.String())
	}

	// Aqui assumimos que o script Node.js imprime os links coletados como uma lista JSON
	links := []string{}
	err = json.Unmarshal(out.Bytes(), &links)
	if err != nil {
		return nil, fmt.Errorf("error parsing crawlee output: %v", err)
	}

	return links, nil
}
