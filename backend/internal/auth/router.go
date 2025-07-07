package auth

import (
	"github.com/go-chi/chi/v5"
)

func newRouter(h handler) chi.Router {
	r := chi.NewRouter()

	r.Get("/", h.indexHandler())
	r.Post("/register", h.registerHandler())
	r.Post("/logout", h.logoutHandler())
	r.Post("/refresh", h.refreshHandler())

	r.Route("/email", func(r chi.Router) {
		r.Post("/setup", h.setupEmailHandler())
		r.Post("/verify", h.verifyEmailHandler())
	})

	return r
}
