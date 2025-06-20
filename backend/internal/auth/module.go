package auth

import (
	"github.com/go-chi/chi/v5"

	"letsgo/internal/config"
	"letsgo/internal/repo"
	"letsgo/internal/token"
)

type AuthModule interface {
	Router() chi.Router
}

type authImpl struct {
	router chi.Router
}

func NewModule(userRepo repo.UserRepo, kvStore repo.KVStore, accMngr token.UserManager, config *config.Auth) AuthModule {
	service := newService(accMngr, userRepo, kvStore, config)
	handler := newHandler(service, config)
	router := newRouter(handler)

	return &authImpl{router: router}
}

func (m *authImpl) Router() chi.Router {
	return m.router
}
