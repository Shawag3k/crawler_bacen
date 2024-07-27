package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
)

func RunCrawler(requestData map[string]string) (string, error) {
	// Convert requestData to JSON or any other format required by the Node.js script.
	requestDataJSON, err := json.Marshal(requestData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request data: %w", err)
	}

	fmt.Printf("Executing crawler with data: %s\n", requestDataJSON)

	// Execute the Node.js script
	cmd := exec.Command("node", "/app/internal/automation/src/crawlee_worker.js")
	cmd.Env = append(os.Environ(), fmt.Sprintf("CRAWL_DATA=%s", requestDataJSON))

	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Error executing crawler: %s\n", err)
		return "", fmt.Errorf("failed to run crawler: %w", err)
	}

	// Output as plain text for debugging purposes
	fmt.Printf("Crawler output: %s\n", output)

	return string(output), nil
}
