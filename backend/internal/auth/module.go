package auth

import (
	"github.com/go-chi/chi/v5"

	"gonext/internal/config"
	"gonext/internal/mail"
	"gonext/internal/mdw"
	"gonext/internal/model"
	"gonext/internal/repo"
	"gonext/internal/token"
)

type AuthModule interface {
	Router() chi.Router
}

type authImpl struct {
	router chi.Router
}

func NewModule(
	userRepo repo.UserRepo,
	kvMngr token.KVManager,
	accMngr token.UserManager,
	mailer mail.Mailer,
	config *config.Auth,
	authMdw mdw.Middleware,
) AuthModule {
	service := newService(accMngr, userRepo, kvMngr, mailer, config)
	handler := newHandler(service, config)

	router := newRouter(handler, authMdw)
	return &authImpl{router: router}
}

func (m *authImpl) Router() chi.Router {
	return m.router
}

type authResult struct {
	access  string
	refresh string
	user    *model.User
}
