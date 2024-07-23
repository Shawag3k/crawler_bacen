package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
)

func RunCrawler(requestData map[string]string) ([]string, error) {
	// Convert requestData to JSON string
	requestDataJSON, err := json.Marshal(requestData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request data: %w", err)
	}

	// Criar o comando para executar o Crawlee
	cmd := exec.Command("node", "/app/internal/automation/src/crawlee_worker.js")
	cmd.Env = append(os.Environ(), fmt.Sprintf("CRAWL_DATA=%s", requestDataJSON))
	output, err := cmd.CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("failed to run crawler: %w, output: %s", err, output)
	}

	var links []string
	if err := json.Unmarshal(output, &links); err != nil {
		return nil, fmt.Errorf("failed to parse output: %w, output: %s", err, output)
	}

	return links, nil
}
