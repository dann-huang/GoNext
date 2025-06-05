package user

import (
	"database/sql"
	"net/http"

	"letsgo/internal/auth"
	"letsgo/internal/config"
	"letsgo/internal/mdw"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

type UserModule interface {
	Router() chi.Router
	AuthRouter() chi.Router
}

type userModule struct {
	router     chi.Router
	authRouter chi.Router
}

func NewModule(db *sql.DB, rdb *redis.Client, accManager auth.AccessTokenManager, refManager auth.RefreshManager,
	accMdw func(http.Handler) http.Handler, userCtxKey mdw.ContextKey, config *config.Auth) UserModule {

	repo := NewPgRepo(db)
	service := NewService(repo)
	handler := NewHandler(service)
	router := NewRouter(handler)

	return &userModule{
		router:     router,
		authRouter: router,
	}
}

func (m *userModule) Router() chi.Router {
	return m.router
}

func (m *userModule) AuthRouter() chi.Router {
	return m.authRouter
}
