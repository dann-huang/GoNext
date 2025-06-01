package main

import (
	"net/http"

	"letsgo/internal/static"

	"github.com/go-chi/chi/v5"
)

func main() {
	r := chi.NewRouter()

	// TODO: Add middleware usage here (e.g., auth, logging)

	// API routes
	r.Route("/api", func(apiRouter chi.Router) {
		// TODO: Mount business logic handlers from api package
		apiRouter.Get("/hello", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"message": "Hello from API!"}`))
		})
	})

	// Auth routes (placeholder)
	r.Route("/auth", func(authRouter chi.Router) {
		// TODO: Mount authentication handlers from auth package
	})

	// WebSocket routes (placeholder)
	r.Route("/ws", func(wsRouter chi.Router) {
		// TODO: Mount WebSocket handlers from ws package
	})

	// Room management routes (placeholder)
	r.Route("/rooms", func(roomRouter chi.Router) {
		// TODO: Mount room management handlers from rooms package
	})

	// WebRTC signaling routes (placeholder)
	r.Route("/webrtc", func(webrtcRouter chi.Router) {
		// TODO: Mount WebRTC signaling handlers from webrtc package
	})

	// static pages
	staticDir := "/app/static"
	r.Get("/test/*", static.TestPageHandler(staticDir))
	r.Get("/*", static.SPAHandler(staticDir))

	http.ListenAndServe(":3000", r)
}
