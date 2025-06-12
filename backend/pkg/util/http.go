package util

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

func RespondErr(w http.ResponseWriter, status int, msg string, err error) {
	if err != nil {
		slog.Error(err.Error())
	}
	RespondJSON(w, status, map[string]string{"message": msg})
}

func RespondJSON(w http.ResponseWriter, status int, payload any) {
	response, err := json.Marshal(payload)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Things Broke..."))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(response)
}
