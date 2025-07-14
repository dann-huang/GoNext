package main

import (
	"log/slog"
	"net/http"
	"os"

	"gonext/internal/auth"
	"gonext/internal/config"
	"gonext/internal/db"
	"gonext/internal/external"
	"gonext/internal/game"
	"gonext/internal/live"
	"gonext/internal/mail"
	"gonext/internal/mdw"
	"gonext/internal/repo"
	"gonext/internal/token"
	"gonext/pkg/jwt/v2"
	"gonext/pkg/util/httputil"

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
	mailer := mail.NewResendMailer(appCfg.Mail)
	validator := httputil.NewValidator()

	accessManager, err := jwt.NewManager(
		appCfg.Auth.AccSecret,
		appCfg.Auth.AccTTL,
		appCfg.Auth.Issuer,
		appCfg.Auth.Audience,
		token.UserPayload{},
	)
	if err != nil {
		panic(err)
	}
	kvMngr := token.NewRedisKVMngr(store.KVStore, appCfg.Token)
	authMdw := mdw.AccessMdw(accessManager, appCfg.Auth.AccCookieName, appCfg.Auth.AccTTL)
	authModule := auth.NewModule(
		store.User,
		kvMngr,
		accessManager,
		mailer,
		appCfg.Auth,
		authMdw,
		validator,
	)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	gameRegistry := game.NewRegistry()
	gameRegistry.RegisterAll()

	r.Route("/api", func(api chi.Router) {
		api.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			if _, err := w.Write([]byte(`{"status":"ok"}`)); err != nil {
				slog.Error("failed to write health response", "error", err)
			}
		})

		api.Mount("/auth", authModule.Router())

		api.Group(func(protected chi.Router) {
			protected.Use(authMdw)
			protected.Mount("/live", live.Router(gameRegistry, appCfg.WS))
		})
	})

	r.Get("/stat/*", external.StaticPageHandler(appCfg.StaticPages))

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		httputil.RespondErr(w, http.StatusNotFound, "Route not found", nil)
	})

	println("---Server start---")
	if err := http.ListenAndServe(":3333", r); err != nil {
		slog.Error("server error", "error", err)
	}
}
