package live

import (
	"encoding/json"
	"letsgo/internal/token"
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
	leaveRoom  chan *crPair

	mu sync.RWMutex
}

func newHub() *hub {
	return &hub{
		rooms:      make(map[string]*room, 10),
		clients:    make(map[string]*client, 10),
		messages:   make(chan *roomMsg, 256),
		register:   make(chan *client, 10),
		unregister: make(chan *client, 10),
		joinRoom:   make(chan *crPair, 20),
		leaveRoom:  make(chan *crPair, 20),
	}
}

func (h *hub) AddClient(conn *websocket.Conn, user *token.UserPayload) {
	client := newClient(h, conn, user)
	h.register <- client
	go client.writePump()
	go client.readPump()
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
				errMsg := createMsg("Room not found, kicking back to lobby", msgError)
				client.Send <- errMsg
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
			slog.Debug("Client joined room successfully.", "clientID", client.ID, "roomID", roomID)

		case pair := <-h.leaveRoom:
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomName

			if room, ok := h.rooms[roomID]; ok {
				if room == lobby {
					continue
				}
				room.removeClient(client)
				if len(room.clients) == 0 {
					delete(h.rooms, room.name)
				}
				slog.Debug("Client left room.", "clientID", client.ID, "roomID", roomID)
				statusMsg := createMsg("Back to lobby", msgStatus)
				client.Send <- statusMsg
				lobby.addClient(client)
			}
			h.mu.Unlock()
		}
	}
}
