package auth

import (
	"database/sql"

	"letsgo/internal/config"
	"letsgo/pkg/jwt"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

func Router(db *sql.DB, rdb *redis.Client, jwt *jwt.JWTManager, config *config.Auth) chi.Router {
	s := NewAuthService(db, rdb, jwt, config)

	r := chi.NewRouter()
	r.Get("/", s.IndexHandler())
	r.Post("/register", s.RegisterHandler())
	r.Post("/login", s.LoginHandler())
	r.Post("/logout", s.LogoutHandler())
	r.Post("/refresh", s.RefreshHandler())
	return r
}
