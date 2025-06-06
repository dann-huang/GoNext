package auth

import (
	"letsgo/internal/config"
	"letsgo/internal/repo"
	"letsgo/internal/token"

	"github.com/go-chi/chi/v5"
)

type AuthModule interface {
	Router() chi.Router
}

type authImpl struct {
	router chi.Router
}

func NewModule(userRepo repo.UserRepo, kvStore repo.KVStore, accManager token.AccessTokenManager, config *config.Auth) AuthModule {

	service := newService(userRepo, kvStore)
	handler := newHandler(service)
	router := newRouter(handler)

	return &authImpl{router: router}
}

func (m *authImpl) Router() chi.Router {
	return m.router
}
