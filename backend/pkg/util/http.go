package util

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

func RespondErr(w http.ResponseWriter, status int, msg string, err error) {
	if err != nil {
		slog.Error(err.Error())
	}
	if err := RespondJSON(w, status, map[string]string{"message": msg}); err != nil {
		slog.Error("failed to write error response", "error", err)
	}
}

func RespondJSON(w http.ResponseWriter, code int, payload any) error {
	response, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal response: %w", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if _, err := w.Write(response); err != nil {
		return fmt.Errorf("failed to write response: %w", err)
	}
	return nil
}

func RespondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if _, err := w.Write([]byte(`{"error": "` + message + `"}`)); err != nil {
		// Log the error since we can't send it to the client if the write failed
		slog.Error("Failed to write error response", "error", err)
	}
}
