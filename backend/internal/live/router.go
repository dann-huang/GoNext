package live

import (
	"letsgo/internal/config"
	"letsgo/internal/mdw"
	"letsgo/internal/token"
	"log/slog"
	"net/http"

	"github.com/coder/websocket"
	"github.com/go-chi/chi/v5"
)

func Router(authMdw mdw.Middleware, ctxKey mdw.ContextKey, cfg *config.WS) chi.Router {
	hub := newHub(cfg)
	go hub.Run()

	r := chi.NewRouter()
	r.Use(authMdw)
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		conn, err := websocket.Accept(w, r, nil)
		if err != nil {
			slog.Error("Failed to accept WebSocket connection.", "error", err)
			return
		}
		user := r.Context().Value(ctxKey).(*token.UserPayload)

		client := newClient(hub, conn, user, cfg)
		hub.register <- client
		client.start()
	})

	return r
}
