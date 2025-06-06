package auth

import (
	"github.com/go-chi/chi/v5"
)

func newRouter(h handler) chi.Router {
	r := chi.NewRouter()

	r.Get("/", h.indexHandler())
	r.Post("/register", h.registerHandler())
	r.Post("/login", h.loginHandler())
	r.Post("/logout", h.logoutHandler())
	r.Post("/refresh", h.refreshHandler())

	return r
}
