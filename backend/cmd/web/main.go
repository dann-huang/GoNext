package main

import (
	"log/slog"
	"net/http"
	"os"

	"letsgo/internal/auth"
	"letsgo/internal/config"
	"letsgo/internal/db"
	"letsgo/internal/external"
	"letsgo/internal/game"
	"letsgo/internal/live"
	"letsgo/internal/mdw"
	"letsgo/internal/repo"
	"letsgo/internal/token"
	"letsgo/pkg/jwt/v2"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	appCfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))
	slog.SetDefault(logger)

	postgres, redis, err := db.Open(appCfg.DB)
	if err != nil {
		panic(err)
	}
	defer postgres.Close()

	store := repo.NewStore(postgres, redis)

	accessManager, err := jwt.NewManager(appCfg.Auth.AccSecret,
		appCfg.Auth.AccTTL, appCfg.Auth.Issuer, appCfg.Auth.Audience, token.UserPayload{})
	if err != nil {
		panic(err)
	}
	authModule := auth.NewModule(store.User, store.KVStore, accessManager, appCfg.Auth)

	const userCtxKey mdw.ContextKey = "userPayload"
	userAccMdw := mdw.AccessMdw(accessManager, appCfg.Auth.AccCookieName, appCfg.Auth.AccTTL, userCtxKey)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	gameReg := game.NewRegistry()
	gameReg.RegisterAll()

	r.Route("/api", func(api chi.Router) {
		api.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok"}`))
		})

		api.Mount("/auth", authModule.Router())
		api.Mount("/live", live.Router(userAccMdw, userCtxKey, gameReg, appCfg.WS))
	})

	// static pages
	r.Get("/stat/*", external.StaticPageHandler(appCfg.StaticPages))

	// frontend
	// r.Mount("/", external.FrontendRevProxy(cfg.FrontendUrl))

	println("---Server start---")
	http.ListenAndServe(":3333", r)
}
