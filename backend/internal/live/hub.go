package live

import (
	"letsgo/internal/config"
	"letsgo/internal/game"
	"log/slog"
	"time"
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
			h.clients[client] = struct{}{}
			lobby.addClient(client)
			client.start()
			slog.Debug("Registered: ", "client", client.ID)

		case client := <-h.unregister:
			client.room.removeClient(client)
			if client.room != lobby && len(client.room.clients) == 0 {
				delete(h.rooms, client.room.name)
			}
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				slog.Debug("Unregistered: ", "client", client.ID)
			}
			time.AfterFunc(100*time.Millisecond, client.stop)

		case pair := <-h.joinRoom:
			slog.Debug("join room")
			client := pair.Client
			roomName := pair.RoomName
			if client.room.name == roomName {
				continue
			}
			oldRoom := client.room
			oldRoom.removeClient(client)
			if oldRoom != lobby && len(oldRoom.clients) == 0 {
				delete(h.rooms, oldRoom.name)
			}
			room, ok := h.rooms[roomName]
			if !ok {
				room = newRoom(roomName, h.registry)
				h.rooms[room.name] = room
			}
			room.addClient(client)
			slog.Debug("Client joined room successfully.", "client", client.ID, "roomID", roomName)

		case client := <-h.leaveRoom:
			room := client.room
			if room == lobby {
				continue
			}
			room.removeClient(client)
			if len(room.clients) == 0 {
				delete(h.rooms, room.name)
			}
			slog.Debug("Client left room.", "client", client.ID, "roomID", room.name)
			lobby.addClient(client)
		}
	}
}
