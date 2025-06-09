package live

import (
	"encoding/json"
	"letsgo/internal/config"
	"log/slog"
	"sync"

	"github.com/coder/websocket"
)

type hub struct {
	rooms    map[string]*room
	clients  map[string]*client
	messages chan *roomMsg

	register   chan *client
	unregister chan *client
	joinRoom   chan *crPair
	leaveRoom  chan *client

	mu sync.RWMutex
}

func newHub(cfg *config.WS) *hub {
	return &hub{
		rooms:      make(map[string]*room),
		clients:    make(map[string]*client),
		messages:   make(chan *roomMsg, cfg.MsgBuffer),
		register:   make(chan *client, cfg.RegisterBuffer),
		unregister: make(chan *client, cfg.RegisterBuffer),
		joinRoom:   make(chan *crPair, cfg.RoomBuffer),
		leaveRoom:  make(chan *client, cfg.RoomBuffer),
	}
}

func (h *hub) Run() {
	lobby := newRoom("Lobby")
	h.rooms[lobby.name] = lobby

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			lobby.addClient(client)
			h.mu.Unlock()
			slog.Debug("Registered: ", "client", client.ID)

		case client := <-h.unregister:
			h.mu.Lock()
			if room, ok := h.rooms[client.Room]; ok {
				room.removeClient(client)
				if room != lobby && len(room.clients) == 0 {
					delete(h.rooms, room.name)
				}
			}
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
				client.cancel()
				client.Conn.Close(websocket.StatusNormalClosure, "client leaving")
				slog.Debug("Unregistered: ", "client", client.ID)
			}
			h.mu.Unlock()

		case msg := <-h.messages:
			slog.Debug("Sending msg", "message", msg)
			h.mu.RLock()
			client, ok := h.clients[msg.SenderID]
			if !ok {
				h.mu.RUnlock()
				continue
			}
			room, ok := h.rooms[client.Room]
			h.mu.RUnlock()
			if !ok {
				client.Send <- createMsg(msgError, "error", "Room not found, kicking back to lobby")
				h.joinRoom <- &crPair{client, lobby.name}
				lobby.addClient(client)
				continue
			}
			jsonMessage, err := json.Marshal(msg)
			if err != nil {
				slog.Error("Failed to marshal message", "error", err, "message", msg)
				continue
			}
			room.broadcast(jsonMessage)

		case pair := <-h.joinRoom:
			slog.Debug("join room")
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomName
			if client.Room == "" || client.Room == roomID {
				h.mu.Unlock()
				continue
			}
			if oldRoom, ok := h.rooms[client.Room]; ok {
				oldRoom.removeClient(client)
				if oldRoom != lobby && len(oldRoom.clients) == 0 {
					delete(h.rooms, oldRoom.name)
				}
			}
			room, ok := h.rooms[roomID]
			if !ok {
				room = newRoom(roomID)
				h.rooms[room.name] = room
			}
			room.addClient(client)
			h.mu.Unlock()
			slog.Debug("Client joined room successfully.", "client", client.ID, "roomID", roomID)

		case client := <-h.leaveRoom:
			h.mu.Lock()
			roomID := client.Room

			if room, ok := h.rooms[roomID]; ok {
				if room == lobby {
					continue
				}
				room.removeClient(client)
				if len(room.clients) == 0 {
					delete(h.rooms, room.name)
				}
				slog.Debug("Client left room.", "client", client.ID, "roomID", roomID)
				lobby.addClient(client)
			}
			h.mu.Unlock()
		}
	}
}
