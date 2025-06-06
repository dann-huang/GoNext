package auth

import (
	"github.com/go-chi/chi/v5"
)

func newRouter(h handler) chi.Router {
	r := chi.NewRouter()

	r.Get("/", h.indexHandler())
	r.Get("/register", h.registerHandler())
	r.Get("/login", h.loginHandler())
	r.Get("/logout", h.logoutHandler())
	r.Get("/refresh", h.refreshHandler())

	return r
}
