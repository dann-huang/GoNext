package main

import (
	"log/slog"
	"net/http"
	"os"

	"letsgo/internal/auth"
	"letsgo/internal/db"
	"letsgo/internal/live"
	"letsgo/internal/mdw"
	"letsgo/internal/repo"
	"letsgo/internal/static"
	"letsgo/internal/token"
	"letsgo/pkg/jwt/v2"

	"letsgo/internal/config"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	postgres, redis, err := db.Open(cfg.DB)
	if err != nil {
		panic(err)
	}
	defer postgres.Close()

	store := repo.NewStore(postgres, redis)

	accessManager, err := jwt.NewManager(cfg.Auth.AccSecret,
		cfg.Auth.AccTTL, cfg.Auth.Issuer, cfg.Auth.Audience, token.AccessPayload{})
	if err != nil {
		panic(err)
	}
	authModule := auth.NewModule(store.User, store.KVStore, accessManager, cfg.Auth)

	const userCtxKey mdw.ContextKey = "userPayload"
	// userAccMdw := mdw.AccessMdw(accessManager, cfg.Auth.AccCookieName, cfg.Auth.AccTTL, userCtxKey)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Route("/api", func(api chi.Router) {
		api.Mount("/auth", authModule.Router())
		api.Mount("/live", live.Router())
	})

	// static pages
	staticDir := "/app/static"
	r.Get("/test/*", static.TestPageHandler(staticDir))
	r.Get("/*", static.SPAHandler(staticDir))

	http.ListenAndServe(":3000", r)
}
