package live

import (
	"letsgo/internal/config"
	"letsgo/internal/game"
	"log/slog"
	"sync"

	"github.com/coder/websocket"
)

type hub struct {
	registry *game.Registry
	cfg      *config.WS
	rooms    map[string]*room
	clients  map[*client]struct{}

	register   chan *client
	unregister chan *client
	joinRoom   chan *crPair
	leaveRoom  chan *client

	mu sync.RWMutex
}

func newhub(registry *game.Registry, cfg *config.WS) *hub {
	return &hub{
		registry:   registry,
		cfg:        cfg,
		rooms:      make(map[string]*room),
		clients:    make(map[*client]struct{}),
		register:   make(chan *client, cfg.RegisterBuffer),
		unregister: make(chan *client, cfg.RegisterBuffer),
		joinRoom:   make(chan *crPair, cfg.RoomBuffer),
		leaveRoom:  make(chan *client, cfg.RoomBuffer),
	}
}

func (h *hub) run() {
	lobby := newRoom("Lobby", h.registry)
	h.rooms[lobby.name] = lobby

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = struct{}{}
			lobby.addClient(client)
			h.mu.Unlock()
			slog.Debug("Registered: ", "client", client.ID)

		case client := <-h.unregister:
			h.mu.Lock()
			if client.room != nil {
				client.room.removeClient(client)
				if client.room != lobby && len(client.room.clients) == 0 {
					delete(h.rooms, client.room.name)
				}
			}
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				client.cancel()
				client.conn.Close(websocket.StatusNormalClosure, "client leaving")
				slog.Debug("Unregistered: ", "client", client.ID)
			}
			h.mu.Unlock()

		case pair := <-h.joinRoom:
			slog.Debug("join room")
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomName
			if client.room != nil && client.room.name == roomID {
				h.mu.Unlock()
				continue
			}
			if client.room != nil {
				oldRoom := client.room
				oldRoom.removeClient(client)
				if oldRoom != lobby && len(oldRoom.clients) == 0 {
					delete(h.rooms, oldRoom.name)
				}
			}
			room, ok := h.rooms[roomID]
			if !ok {
				room = newRoom(roomID, h.registry)
				h.rooms[room.name] = room
			}
			room.addClient(client)
			h.mu.Unlock()
			slog.Debug("Client joined room successfully.", "client", client.ID, "roomID", roomID)

		case client := <-h.leaveRoom:
			h.mu.Lock()
			if client.room != nil {
				room := client.room
				if room == lobby {
					h.mu.Unlock()
					continue
				}
				room.removeClient(client)
				if len(room.clients) == 0 {
					delete(h.rooms, room.name)
				}
				slog.Debug("Client left room.", "client", client.ID, "roomID", room.name)
				lobby.addClient(client)
			}
			h.mu.Unlock()
		}
	}
}
