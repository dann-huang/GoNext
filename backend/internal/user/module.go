package user

import (
	"net/http"

	"letsgo/internal/auth"
	"letsgo/internal/config"
	"letsgo/internal/mdw"
	"letsgo/internal/repo"

	"github.com/go-chi/chi/v5"
)

type UserModule interface {
	Router() chi.Router
	AuthRouter() chi.Router
}

type userModule struct {
	router     chi.Router
	authRouter chi.Router
}

func NewModule(userRepo repo.UserRepo, accManager auth.AccessTokenManager, refManager auth.RefreshManager,
	accMdw func(http.Handler) http.Handler, userCtxKey mdw.ContextKey, config *config.Auth) UserModule {

	service := NewService(userRepo)
	handler := newHandler(service)
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
