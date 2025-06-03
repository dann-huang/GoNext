package room

import (
	"log/slog"
	"math/rand"
	"net/http"
	"strconv"

	"github.com/coder/websocket"
	"github.com/go-chi/chi/v5"
)

func Router() chi.Router {
	r := chi.NewRouter()
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "room service is running"}`))
	})

	hub := NewHub()
	go hub.Run()

	r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {

		// if r.Header.Get("Origin") != "localhost:3000" {
		// 	util.RespondJSON(w, http.StatusForbidden, map[string]string{
		// 		"error": "Forbidden: Invalid Origin",
		// 	})
		// 	http.Error(w, "Forbidden", http.StatusForbidden)
		// 	return
		// }

		conn, err := websocket.Accept(w, r, nil)
		if err != nil {
			slog.Error("Failed to accept WebSocket connection.", "error", err)
			return
		}

		clientName := strconv.FormatInt(int64(rand.Intn(1000)), 10)
		client := NewClient(hub, conn, clientName)

		client.Hub.Register <- client
		slog.Info("Client connected.", "client", client)
		go client.WritePump()
		go client.ReadPump()

	})

	return r
}
