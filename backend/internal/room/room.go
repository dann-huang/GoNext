// room/room.go
package room

import (
	"encoding/json"
	"log/slog"
	"sync"
)

type room struct {
	// ID      string
	name    string
	clients map[string]*client
	mu      sync.RWMutex
}

func newRoom(name string) *room {
	return &room{
		name:    name,
		clients: make(map[string]*client),
		mu:      sync.RWMutex{},
	}
}

func (r *room) addClient(client *client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.clients[client.ID] = client
	client.Room = r.name

	r.broadcast(createMsg(client.Name+" has joined the room.", r.name, msgStatus))
	r.broadcast(r.getClientList())
}

func (r *room) removeClient(client *client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.clients[client.ID]; ok {
		delete(r.clients, client.ID)
		client.Room = ""
		r.broadcast(createMsg(client.Name+" has left the room.", r.name, msgStatus))
		r.broadcast(r.getClientList())
	}
}

func (r *room) broadcast(message []byte) {
	for _, client := range r.clients {
		select {
		case client.Send <- message:
		default:
			slog.Warn("Failed to send message to client. Removing client.", "clientID", client.ID, "roomID", r.name)
		}
	}
}

func (r *room) getClientList() []byte {
	clientNames := make([]string, 0, len(r.clients))
	for _, client := range r.clients {
		clientNames = append(clientNames, client.Name)
	}

	payload := map[string]interface{}{
		"roomName":  r.name,
		"clientIDs": clientNames,
	}

	msg := &Message{
		Type:     msgGetClients,
		RoomName: r.name,
		Payload:  payload,
	}

	jsonMessage, err := json.Marshal(msg)
	if err != nil {
		slog.Error("Error marshaling client list message.", "error", err)
		return nil
	}
	return jsonMessage
}
