package user

import (
	"database/sql"

	"letsgo/internal/claim"
	"letsgo/internal/config"
	"letsgo/pkg/jwt"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

type UserModule interface {
	Router() chi.Router
}

type userModule struct {
	db     *sql.DB
	rdb    *redis.Client
	jwt    *jwt.JWTManager[claim.UserClaims]
	config *config.Auth
	router chi.Router
}

func NewModule(db *sql.DB, rdb *redis.Client, jwt *jwt.JWTManager[claim.UserClaims], config *config.Auth) any {
	r := chi.NewRouter()
	return &userModule{
		db:     db,
		rdb:    rdb,
		jwt:    jwt,
		config: config,
		router: r,
	}
}

func (m *userModule) Router() chi.Router {
	return m.router
}
