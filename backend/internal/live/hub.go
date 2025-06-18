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
	messages chan *hubMsg

	register   chan *client
	unregister chan *client
	joinRoom   chan *crPair
	leaveRoom  chan *client

	mu sync.RWMutex
} // Room pointers now used in client.Room

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
			if client.Room != nil {
				client.Room.removeClient(client)
				if client.Room != lobby && len(client.Room.clients) == 0 {
					delete(h.rooms, client.Room.name)
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

		case hubmsg := <-h.messages:
			slog.Debug("Sending msg", "message", hubmsg.msg)
			h.mu.RLock()
			client := hubmsg.client
			if client == nil {
				h.mu.RUnlock()
				continue
			}
			room := client.Room
			h.mu.RUnlock()
			if room == nil {
				client.Send <- createMsg(msgError, "message", "Room not found, kicking back to lobby")
				h.joinRoom <- &crPair{client, lobby.name}
				lobby.addClient(client)
				continue
			}
			jsonMessage, err := json.Marshal(hubmsg.msg)
			if err != nil {
				slog.Error("Failed to marshal message", "error", err, "message", hubmsg.msg)
				continue
			}
			room.broadcast(jsonMessage)

		case pair := <-h.joinRoom:
			slog.Debug("join room")
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomName
			if client.Room != nil && client.Room.name == roomID {
				h.mu.Unlock()
				continue
			}
			if client.Room != nil {
				oldRoom := client.Room
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
			if client.Room != nil {
				room := client.Room
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
