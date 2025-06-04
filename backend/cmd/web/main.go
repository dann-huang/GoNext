package main

import (
	"log/slog"
	"net/http"
	"os"

	"letsgo/internal/db"
	"letsgo/internal/room"
	"letsgo/internal/static"

	"letsgo/internal/config"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))
	slog.SetDefault(logger)

	appConfig, err := config.Load()
	if err != nil {
		panic(err)
	}
	postgres, _, err := db.Open(&appConfig.DB)
	if err != nil {
		panic(err)
	}
	defer postgres.Close()

	// user.InitSchema(postgres)

	// jwtManager := jwt.NewManager(
	// 	appConfig.Auth.AccessTokenSecret, appConfig.Auth.AccessTokenTTL,
	// 	appConfig.Auth.Issuer, appConfig.Auth.Audience,
	// )

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Route("/api", func(api chi.Router) {
		// api.Mount("/auth", auth.Router(postgres, redis, jwtManager, &appConfig.Auth))
		api.Mount("/room", room.Router())
	})

	// static pages
	staticDir := "/app/static"
	r.Get("/test/*", static.TestPageHandler(staticDir))
	r.Get("/*", static.SPAHandler(staticDir))

	http.ListenAndServe(":3000", r)
}
