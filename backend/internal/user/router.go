package user

import (
	"github.com/go-chi/chi/v5"
)

func NewRouter(h Handler) chi.Router {
	r := chi.NewRouter()

	r.Get("/", h.IndexHandler())
	r.Get("/register", h.RegisterHandler())
	r.Get("/login", h.LoginHandler())
	r.Get("/logout", h.LogoutHandler())
	r.Get("/refresh", h.RefreshHandler())

	return r
}
