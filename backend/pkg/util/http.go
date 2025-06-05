package util

import (
	"encoding/json"
	"net/http"
)

func RespondErr(w http.ResponseWriter, status int, msg string, err error) {
	if err != nil {
		//todo: error handling
	}
	RespondJSON(w, status, map[string]string{"error": msg})
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
