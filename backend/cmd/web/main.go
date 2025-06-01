package main

import (
	"net/http"

	"letsgo/internal/auth"
	"letsgo/internal/db"
	"letsgo/internal/static"

	"letsgo/internal/config"
	"letsgo/pkg/jwt"

	"github.com/go-chi/chi/v5"
)

func main() {
	appConfig, err := config.Load()
	if err != nil {
		panic(err)
	}

	postgres, redis, err := db.Open(&appConfig.DB)
	if err != nil {
		panic(err)
	}
	defer postgres.Close()

	jwtManager := jwt.NewManager(
		appConfig.Auth.AccessTokenSecret, appConfig.Auth.AccessTokenTTL,
		appConfig.Auth.Issuer, appConfig.Auth.Audience,
	)

	r := chi.NewRouter()
	r.Route("/api", func(api chi.Router) {
		api.Mount("/auth", auth.Router(postgres, redis, &jwtManager, &appConfig.Auth))
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
