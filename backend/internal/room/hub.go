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
		Rooms:      make(map[string]*Room),
		Clients:    make(map[string]*Client),
		Messages:   make(chan *Message),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		CreateRoom: make(chan string),
		JoinRoom:   make(chan *ClientRoomPair),
		LeaveRoom:  make(chan *ClientRoomPair),
	}
}

func (h *Hub) Run() {
	defaultRoom := NewRoom("Lobby")
	h.Rooms[defaultRoom.ID] = defaultRoom
	slog.Info("Lobby created", "name", defaultRoom.Name, "id", defaultRoom.ID)

	for { // infinite event loop
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.ID] = client
			h.mu.Unlock()
			slog.Info("registered:", "id", client.ID, "name", client.Name)

			h.JoinRoom <- &ClientRoomPair{Client: client, RoomID: defaultRoom.ID}

		case client := <-h.Unregister:
			h.mu.Lock()
			// Remove client from their current room first
			if client.RoomID != "" {
				if room, ok := h.Rooms[client.RoomID]; ok {
					room.RemoveClient(client)
					// todo: broadcast leaving
					// room.BroadcastMessage(createStatusMessage(client.Username+" has left.", client.RoomID))
					slog.Info("left room", "name", client.Name, "roomID", client.RoomID)
				}
			}
			// Then remove from the Hub's global clients list
			if _, ok := h.Clients[client.ID]; ok {
				delete(h.Clients, client.ID)
				close(client.Send) // Close the client's send channel to signal its writePump to exit
				client.cancel()    // Cancel the client's context to stop its goroutines cleanly
				slog.Info("Client unregistered from hub.", "clientID", client.ID, "username", client.Username)
			}
			h.mu.Unlock()

		// --- Inbound Messages from Clients ---
		case message := <-h.Messages:
			h.mu.RLock()
			room, ok := h.Rooms[message.RoomID]
			h.mu.RUnlock()
			if ok {
				jsonMessage, err := json.Marshal(message)
				if err != nil {
					slog.Error("Error marshaling message for broadcast.", "error", err, "messageType", message.Type)
					continue // Skip to next
				}
				room.BroadcastMessage(jsonMessage) // We'll implement this method on the Room struct
				slog.Debug("Broadcasting message to room.", "roomID", message.RoomID, "messageType", message.Type, "senderID", message.SenderID)
			} else {
				slog.Warn("Received message for non-existent room.", "roomID", message.RoomID, "senderID", message.SenderID, "messageType", message.Type)
				// Optionally, send an error message back to the sender
				if client, ok := h.Clients[message.SenderID]; ok {
					errMsg := createErrorMessage("Room not found for message: "+message.RoomID, "") // Helper function to create error message
					client.Send <- errMsg
				}
			}

		// --- Room Creation Requests ---
		case roomName := <-h.CreateRoom:
			h.mu.Lock()
			newRoom := NewRoom(roomName)
			h.Rooms[newRoom.ID] = newRoom
			h.mu.Unlock()
			slog.Info("New room created.", "roomName", newRoom.Name, "roomID", newRoom.ID)
			// After creating a room, you might want to broadcast the updated room list
			// to all connected clients so they can see the new room.
			// h.broadcastRoomList() // We'll implement this helper later.

		// --- Join Room Requests ---
		case pair := <-h.JoinRoom:
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomID

			if client.RoomID != "" && client.RoomID != roomID {
				if oldRoom, ok := h.Rooms[client.RoomID]; ok {
					oldRoom.RemoveClient(client)
					// oldRoom.BroadcastMessage(createStatusMessage(client.Username+" has left.", client.RoomID))
					slog.Info("Client left old room before joining new.", "clientID", client.ID, "oldRoomID", client.RoomID, "newRoomID", roomID)
				}
			}

			if room, ok := h.Rooms[roomID]; ok {
				room.AddClient(client)
				// room.BroadcastMessage(createStatusMessage(client.Username+" has joined.", roomID)) // Notify new room
				slog.Info("Client joined room successfully.", "clientID", client.ID, "roomID", roomID)

				// Optional: send updated room list to the joining client
				// if roomListMsg, err := h.getRoomListMessage(); err == nil {
				// 	client.Send <- roomListMsg
				// }
				// Optional: send client list of the joined room to the joining client
				// if clientListMsg, err := createClientListMessage(room); err == nil {
				// 	client.Send <- clientListMsg
				// }
			} else {
				slog.Warn("Attempted to join non-existent room.", "clientID", client.ID, "roomID", roomID)
				errMsg := createErrorMessage("Room not found: "+roomID, "")
				client.Send <- errMsg
			}
			h.mu.Unlock()
			// h.broadcastRoomList() // Update all clients about room changes

		// --- Leave Room Requests ---
		case pair := <-h.LeaveRoom:
			h.mu.Lock()
			client := pair.Client
			roomID := pair.RoomID

			if room, ok := h.Rooms[roomID]; ok {
				room.RemoveClient(client)
				// room.BroadcastMessage(createStatusMessage(client.Username+" has left.", roomID))
				slog.Info("Client left room.", "clientID", client.ID, "roomID", roomID)
			}
			h.mu.Unlock()
			// h.broadcastRoomList() // Update all clients about room changes
		}
	}
}
