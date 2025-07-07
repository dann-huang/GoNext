package auth

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Middleware func(http.Handler) http.Handler

func newRouter(h handler, authMdw Middleware) chi.Router {
	r := chi.NewRouter()

	r.Get("/", h.indexHandler())
	r.Post("/register", h.registerHandler())
	r.Post("/logout", h.logoutHandler())
	r.Post("/refresh", h.refreshHandler())

	r.Group(func(r chi.Router) {
		r.Use(authMdw)

		r.Route("/email", func(r chi.Router) {
			r.Post("/setup", h.setupEmailHandler())
			r.Post("/verify", h.verifyEmailHandler())
		})
		r.Post("/password", h.changePasswordHandler())
	})

	return r
}
