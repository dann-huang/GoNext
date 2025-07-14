package auth

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Middleware func(http.Handler) http.Handler

func newRouter(h handler, authMdw Middleware) chi.Router {
	r := chi.NewRouter()

	r.Get("/", h.indexHandler())
	r.Post("/guest", h.guestHandler())
	r.Post("/logout", h.logoutHandler())
	r.Post("/refresh", h.refreshHandler())

	r.Group(func(r chi.Router) {
		r.Use(authMdw)
		r.Route("/email", func(r chi.Router) {
			r.Post("/setup", h.setEmailHandler())
			r.Post("/verify", h.verifyEmailHandler())
		})
		r.Route("/pass", func(r chi.Router) {
			r.Post("/request", h.reqPassHandler())
			r.Post("/set", h.setPassHandler())
		})
	})

	r.Route("/login", func(r chi.Router) {
		r.Post("/getCode", h.emailCodeHandler())
		r.Post("/useCode", h.emailLoginHandler())
		r.Post("/password", h.passLoginHandler())
	})

	return r
}
