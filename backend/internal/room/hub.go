package room

import (
	"encoding/json"
	"log/slog" // Import slog for structured logging
	"sync"     // For mutexes to protect concurrent access to maps
)

type Hub struct {
	Rooms    map[string]*Room
	Clients  map[string]*Client
	Messages chan *Message

	Register   chan *Client
	Unregister chan *Client
	CreateRoom chan string
	JoinRoom   chan *ClientRoomPair
	LeaveRoom  chan *ClientRoomPair

	mu sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Rooms:      make(map[string]*Room, 10),
		Clients:    make(map[string]*Client, 10),
		Messages:   make(chan *Message),
		Register:   make(chan *Client),
		Unregister: make(chan *Client, 10),
		CreateRoom: make(chan string, 10),
		JoinRoom:   make(chan *ClientRoomPair, 20),
		LeaveRoom:  make(chan *ClientRoomPair, 20),
	}
}

func (h *Hub) Run() {
	lobby := NewRoom("Lobby")
	h.Rooms[lobby.ID] = lobby

	slog.Debug("Hub looping")
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.ID] = client
			slog.Debug("registering: ", "client", client.ID)
			if room, ok := h.Rooms[lobby.ID]; ok {
				room.AddClient(client)
			} else {
				errMsg := createMsg("Lobby broke", lobby.ID, msgError)
				client.Send <- errMsg
			}
			h.mu.Unlock()
			slog.Debug("registered: ", "client", client.ID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if client.Room != "" {
				if room, ok := h.Rooms[client.Room]; ok {
					room.RemoveClient(client)
				}
			}
			if _, ok := h.Clients[client.ID]; ok {
				delete(h.Clients, client.ID)
				close(client.Send)
				client.cancel()
				slog.Debug("Unregistered: ", "client", client.ID)
			}
			h.mu.Unlock()

		case msg := <-h.Messages:
			h.mu.RLock()
			room, ok := h.Rooms[msg.RoomID]
			h.mu.RUnlock()
			if ok {
				jsonMessage, err := json.Marshal(msg)
				if err != nil {
					continue
				}
				room.Broadcast(jsonMessage)
			} else {
				if client, ok := h.Clients[msg.SenderID]; ok {
					errMsg := createMsg("Room not found", "", msgError)
					client.Send <- errMsg
				}
			}

		case roomName := <-h.CreateRoom:
			h.mu.Lock()
			newRoom := NewRoom(roomName)
			h.Rooms[newRoom.ID] = newRoom
			h.mu.Unlock()
			slog.Debug("Room created:", "roomName", newRoom.Name)

		case pair := <-h.JoinRoom:
			slog.Debug("join room")
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomID

			if client.Room != "" && client.Room != roomID {
				if oldRoom, ok := h.Rooms[client.Room]; ok {
					oldRoom.RemoveClient(client)
				}
			}
			if room, ok := h.Rooms[roomID]; ok {
				room.AddClient(client)
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
			roomID := pair.RoomID

			if room, ok := h.Rooms[roomID]; ok {
				room.RemoveClient(client)
				slog.Info("Client left room.", "clientID", client.ID, "roomID", roomID)
			}
			h.mu.Unlock()
		}
	}
}
