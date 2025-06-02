package main

import (
	"log/slog"
	"net/http"
	"os"

	"letsgo/internal/auth"
	"letsgo/internal/db"
	"letsgo/internal/static"

	"letsgo/internal/config"
	"letsgo/internal/user"
	"letsgo/pkg/jwt"

	"github.com/go-chi/chi/v5"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
		// AddSource: true,
	}))
	slog.SetDefault(logger)

	slog.Info("Loading config")
	appConfig, err := config.Load()
	if err != nil {
		panic(err)
	}
	postgres, redis, err := db.Open(&appConfig.DB)
	if err != nil {
		panic(err)
	}
	defer postgres.Close()

	user.InitSchema(postgres)

	jwtManager := jwt.NewManager(
		appConfig.Auth.AccessTokenSecret, appConfig.Auth.AccessTokenTTL,
		appConfig.Auth.Issuer, appConfig.Auth.Audience,
	)

	r := chi.NewRouter()
	r.Route("/api", func(api chi.Router) {
		api.Mount("/auth", auth.Router(postgres, redis, jwtManager, &appConfig.Auth))
		// api.Mount("/room", room.Router())
	})

	// static pages
	staticDir := "/app/static"
	r.Get("/test/*", static.TestPageHandler(staticDir))
	r.Get("/*", static.SPAHandler(staticDir))

	http.ListenAndServe(":3000", r)
}
