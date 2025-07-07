package auth

import (
	"errors"

	"github.com/go-chi/chi/v5"

	"letsgo/internal/config"
	"letsgo/internal/mail"
	"letsgo/internal/mdw"
	"letsgo/internal/model"
	"letsgo/internal/repo"
	"letsgo/internal/token"
)

type AuthModule interface {
	Router() chi.Router
}

type authImpl struct {
	router chi.Router
}

func NewModule(
	userRepo repo.UserRepo,
	kvStore repo.KVStore,
	accMngr token.UserManager,
	mailer mail.Mailer,
	config *config.Auth,
	authMdw mdw.Middleware,
) AuthModule {
	service := newService(accMngr, userRepo, kvStore, mailer, config)
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

var (
	ErrInvalidCode = errors.New("invalid or expired verification code")
)
