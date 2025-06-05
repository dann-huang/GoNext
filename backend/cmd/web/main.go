package main

import (
	"log/slog"
	"net/http"
	"os"

	"letsgo/internal/auth"
	"letsgo/internal/db"
	"letsgo/internal/mdw"
	"letsgo/internal/repo"
	"letsgo/internal/room"
	"letsgo/internal/static"
	"letsgo/internal/user"
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
	db, rdb, err := db.Open(cfg.DB)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	store := repo.NewStore(db, rdb)

	accessManager, err := jwt.NewManager(cfg.Auth.AccSecret,
		cfg.Auth.AccTTL, cfg.Auth.Issuer, cfg.Auth.Audience, auth.AccessPayload{})
	if err != nil {
		panic(err)
	}
	refreshManager := auth.NewRefManager(rdb, cfg.Auth)

	const userCtxKey mdw.ContextKey = "userPayload"
	userAccMdw := mdw.AccessMdw(accessManager, cfg.Auth.AccCookieName, cfg.Auth.AccTTL, userCtxKey)
	userModule := user.NewModule(store.User, accessManager, refreshManager, userAccMdw, userCtxKey, cfg.Auth)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Route("/api", func(api chi.Router) {
		api.Mount("/auth", userModule.AuthRouter())
		api.Mount("/user", userModule.Router())
		api.Mount("/room", room.Router())
	})

	// static pages
	staticDir := "/app/static"
	r.Get("/test/*", static.TestPageHandler(staticDir))
	r.Get("/*", static.SPAHandler(staticDir))

	http.ListenAndServe(":3000", r)
}
