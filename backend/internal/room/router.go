package room

import (
	"net/http"

	"github.com/coder/websocket"
	"github.com/go-chi/chi/v5"
)

var websocketAcceptOptions = &websocket.AcceptOptions{
	OriginPatterns: []string{"*"}, // todo: replace with actual origins
}

func Router() chi.Router {
	r := chi.NewRouter()
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "room service is running"}`))
	})

	hub := NewHub()
	go hub.Run()

	r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {

	})

	return r
}
