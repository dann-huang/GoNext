package live

import (
	"encoding/json"
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
	createRoom chan string
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
		createRoom: make(chan string, 10),
		joinRoom:   make(chan *crPair, 20),
		leaveRoom:  make(chan *crPair, 20),
	}
}

func (h *hub) AddClient(conn *websocket.Conn, name string) {
	client := newClient(h, conn, name)
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
			if room, ok := h.rooms[lobby.name]; ok {
				room.addClient(client)
			} else {
				errMsg := createMsg("Lobby broke", lobby.name, msgError)
				client.Send <- errMsg
			}
			h.mu.Unlock()
			slog.Debug("Registered: ", "client", client.ID)

		case client := <-h.unregister:
			h.mu.Lock()
			if room, ok := h.rooms[client.Room]; ok {
				room.removeClient(client)
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
			room, ok := h.rooms[msg.RoomName]
			h.mu.RUnlock()
			if ok {
				jsonMessage, err := json.Marshal(msg)
				if err != nil {
					continue
				}
				room.broadcast(jsonMessage)
			} else {
				if client, ok := h.clients[msg.SenderID]; ok {
					errMsg := createMsg("Room not found", "", msgError)
					client.Send <- errMsg
				}
			}

		case roomName := <-h.createRoom:
			h.mu.Lock()
			newRoom := newRoom(roomName)
			h.rooms[newRoom.name] = newRoom
			h.mu.Unlock()
			slog.Debug("Room created:", "roomName", newRoom.name)

		case pair := <-h.joinRoom:
			slog.Debug("join room")
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomName

			if client.Room != "" && client.Room != roomID {
				if oldRoom, ok := h.rooms[client.Room]; ok {
					oldRoom.removeClient(client)
				}
			}
			if room, ok := h.rooms[roomID]; ok {
				room.addClient(client)
				slog.Info("Client joined room successfully.", "clientID", client.ID, "roomID", roomID)
			} else {
				slog.Warn("Attempted to join non-existent room.", "clientID", client.ID, "roomID", roomID)
				errMsg := createMsg("Room not found: "+roomID, "", msgError)
				client.Send <- errMsg
			}
			h.mu.Unlock()

		case pair := <-h.leaveRoom:
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomName

			if room, ok := h.rooms[roomID]; ok {
				room.removeClient(client)
				slog.Info("Client left room.", "clientID", client.ID, "roomID", roomID)
			}
			h.mu.Unlock()
		}
	}
}
