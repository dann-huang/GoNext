// room/room.go
package room

import (
	"encoding/json"
	"log/slog"
	"sync"
)

type Room struct {
	ID      string
	Name    string
	Clients map[string]*Client
	mu      sync.RWMutex
}

func NewRoom(name string) *Room {
	return &Room{
		// ID:      uuid.New().String(),
		Name:    name,
		Clients: make(map[string]*Client),
		mu:      sync.RWMutex{},
	}
}

func (r *Room) AddClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.Clients[client.ID] = client
	client.Room = r.Name

	r.Broadcast(createMsg(client.Name+" has joined the room.", r.Name, msgStatus))
	r.Broadcast(getClientList(r))
}

func (r *Room) RemoveClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.Clients[client.ID]; ok {
		delete(r.Clients, client.ID)
		client.Room = ""
		r.Broadcast(createMsg(client.Name+" has left the room.", r.Name, msgStatus))
		r.Broadcast(getClientList(r))
	}
}

func (r *Room) Broadcast(message []byte) {
	for _, client := range r.Clients {
		select {
		case client.Send <- message:
		default:
			slog.Warn("Failed to send message to client. Removing client.", "clientID", client.ID, "roomID", r.Name)
		}
	}
}

func getClientList(room *Room) []byte {
	clientNames := make([]string, 0, len(room.Clients))
	for _, client := range room.Clients {
		clientNames = append(clientNames, client.Name)
	}

	payload := map[string]interface{}{
		// "roomID":    room.ID,
		"roomName":  room.Name,
		"clientIDs": clientNames,
	}

	msg := &Message{
		Type:    msgGetClients,
		RoomID:  room.ID,
		Payload: payload,
	}

	jsonMessage, err := json.Marshal(msg)
	if err != nil {
		slog.Error("Error marshaling client list message.", "error", err)
		return nil
	}
	return jsonMessage
}
