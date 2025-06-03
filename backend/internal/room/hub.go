package room

import (
	"encoding/json"
	"log/slog" // Import slog for structured logging
	"sync"     // For mutexes to protect concurrent access to maps

	"github.com/coder/websocket"
)

type Hub struct {
	Rooms    map[string]*room
	Clients  map[string]*client
	Messages chan *roomMsg

	Register   chan *client
	Unregister chan *client
	CreateRoom chan string
	JoinRoom   chan *crPair
	LeaveRoom  chan *crPair

	mu sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Rooms:      make(map[string]*room, 10),
		Clients:    make(map[string]*client, 10),
		Messages:   make(chan *roomMsg, 256),
		Register:   make(chan *client, 10),
		Unregister: make(chan *client, 10),
		CreateRoom: make(chan string, 10),
		JoinRoom:   make(chan *crPair, 20),
		LeaveRoom:  make(chan *crPair, 20),
	}
}

func (h *Hub) AddClient(conn *websocket.Conn, name string) {
	client := newClient(h, conn, name)
	h.Register <- client
	go client.writePump()
	go client.readPump()
}

func (h *Hub) Run() {
	lobby := newRoom("Lobby")
	h.Rooms[lobby.name] = lobby
	slog.Info("Room hub started, lobby created", "lobby", lobby)

	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.ID] = client
			if room, ok := h.Rooms[lobby.name]; ok {
				room.addClient(client)
			} else {
				errMsg := createMsg("Lobby broke", lobby.name, msgError)
				client.Send <- errMsg
			}
			h.mu.Unlock()
			slog.Debug("Registered: ", "client", client.ID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if room, ok := h.Rooms[client.Room]; ok {
				room.removeClient(client)
			}
			if _, ok := h.Clients[client.ID]; ok {
				delete(h.Clients, client.ID)
				close(client.Send)
				client.cancel()
				slog.Debug("Unregistered: ", "client", client.ID)
			}
			h.mu.Unlock()

		case msg := <-h.Messages:
			slog.Debug("Sending msg", "message", msg)
			h.mu.RLock()
			room, ok := h.Rooms[msg.RoomName]
			h.mu.RUnlock()
			if ok {
				jsonMessage, err := json.Marshal(msg)
				if err != nil {
					continue
				}
				room.broadcast(jsonMessage)
			} else {
				if client, ok := h.Clients[msg.SenderID]; ok {
					errMsg := createMsg("Room not found", "", msgError)
					client.Send <- errMsg
				}
			}

		case roomName := <-h.CreateRoom:
			h.mu.Lock()
			newRoom := newRoom(roomName)
			h.Rooms[newRoom.name] = newRoom
			h.mu.Unlock()
			slog.Debug("Room created:", "roomName", newRoom.name)

		case pair := <-h.JoinRoom:
			slog.Debug("join room")
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomName

			if client.Room != "" && client.Room != roomID {
				if oldRoom, ok := h.Rooms[client.Room]; ok {
					oldRoom.removeClient(client)
				}
			}
			if room, ok := h.Rooms[roomID]; ok {
				room.addClient(client)
				slog.Info("Client joined room successfully.", "clientID", client.ID, "roomID", roomID)
			} else {
				slog.Warn("Attempted to join non-existent room.", "clientID", client.ID, "roomID", roomID)
				errMsg := createMsg("Room not found: "+roomID, "", msgError)
				client.Send <- errMsg
			}
			h.mu.Unlock()

		case pair := <-h.LeaveRoom:
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomName

			if room, ok := h.Rooms[roomID]; ok {
				room.removeClient(client)
				slog.Info("Client left room.", "clientID", client.ID, "roomID", roomID)
			}
			h.mu.Unlock()
		}
	}
}
