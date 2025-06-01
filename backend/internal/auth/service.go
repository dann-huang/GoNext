package auth

import (
	"database/sql"
	"net/http"

	"letsgo/internal/config"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type AuthService struct {
	db  *sql.DB
	rdb *redis.Client
	jwt *JWTManager
}

func NewAuthService(db *sql.DB, rdb *redis.Client, jwt *JWTManager, config *config.Auth) *AuthService {
	return &AuthService{
		db:  db,
		rdb: rdb,
		jwt: jwt,
	}
}

func (s *AuthService) LoginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
	}
}

func (s *AuthService) LogoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
	}
}
