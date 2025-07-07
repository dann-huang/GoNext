package live

import (
	"letsgo/internal/config"
	"letsgo/internal/game"
	"letsgo/internal/mdw"
	"log/slog"
	"net/http"

	"github.com/coder/websocket"
	"github.com/go-chi/chi/v5"
)

func Router(registry *game.Registry, cfg *config.WS) chi.Router {
	hub := newhub(registry, cfg)
	go hub.run()

	r := chi.NewRouter()
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		conn, err := websocket.Accept(w, r, nil)
		if err != nil {
			slog.Error("Failed to accept WebSocket connection.", "error", err)
			return
		}
		user := mdw.GetUser(r.Context())
		if user == nil {
			slog.Error("No user in context for WebSocket connection")
			return
		}
		hub.register <- newClient(hub, conn, user, hub.cfg)
	})
	return r
}
