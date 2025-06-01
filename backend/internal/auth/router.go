package auth

import (
	"database/sql"

	"letsgo/internal/config"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

func Router(db *sql.DB, rdb *redis.Client, config *config.Auth) chi.Router {
	r := chi.NewRouter()
	jwt := NewJWTManager(config)
	s := NewAuthService(db, rdb, jwt, config)

	r.Post("/login", s.LoginHandler())
	r.Post("/logout", s.LogoutHandler())
	return r
}
