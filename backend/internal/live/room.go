// room/room.go
package live

import (
	"encoding/json"
	"letsgo/internal/game"
	"log/slog"
	"sync"
)

type room struct {
	registry *game.Registry
	name     string
	clients  map[string]*client
	mu       sync.RWMutex
	game     game.Game
	gameName string // store which game is active in this room
}

func newRoom(name string, registry *game.Registry) *room {
	return &room{
		name:     name,
		clients:  make(map[string]*client),
		mu:       sync.RWMutex{},
		registry: registry,
	}
}

func (r *room) addClient(client *client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.clients[client.ID] = client
	client.Room = r
	client.Send <- createMsg(msgJoinRoom, "roomName", r.name)

	r.broadcast(createMsg(msgStatus, "message", client.User.Displayname+" has joined "+r.name))
	r.broadcast(r.getClientList())
}

func (r *room) removeClient(client *client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.clients[client.ID]; ok {
		delete(r.clients, client.ID)
		client.Room = nil
		r.broadcast(createMsg(msgStatus, "message", client.User.Displayname+" has left "+r.name))
		r.broadcast(r.getClientList())
	}
}

func (r *room) broadcast(msg []byte) {
	for _, client := range r.clients {
		select {
		case client.Send <- msg:
		default:
			slog.Warn("Invalid client.", "client", client.ID, "roomID", r.name)
		}
	}
}

func (r *room) getClientList() []byte {
	clientNames := make([]string, 0, len(r.clients))
	for _, client := range r.clients {
		clientNames = append(clientNames, client.User.Displayname)
	}

	payload := map[string]any{
		"roomName": r.name,
		"clients":  clientNames,
	}
	payloadBytes, _ := json.Marshal(payload)
	msg := &roomMsg{
		Type:    msgGetClients,
		Payload: json.RawMessage(payloadBytes),
	}
	jsonMessage, err := json.Marshal(msg)
	if err != nil {
		slog.Error("Error marshaling client list message.", "error", err)
		return nil
	}
	return jsonMessage
}

func (r *room) handleGameState(msg *roomMsg) string {
	r.mu.Lock()
	defer r.mu.Unlock()

	var payload GameMessagePayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		return "invalid payload: " + err.Error()
	}

	sender := msg.Sender

	switch payload.Action {
	case "create":
		if r.game != nil && r.game.Exists() {
			return "Game already exists in this room"
		}
		newGame, err := r.registry.Create(payload.GameName)
		if err != nil {
			return err.Error()
		}

		var raw json.RawMessage
		if payload.Create != nil {
			b, err := json.Marshal(payload.Create)
			if err != nil {
				return "invalid create payload: " + err.Error()
			}
			raw = b
		}
		if err := newGame.Create(sender, raw); err != nil {
			return err.Error()
		}
		r.game = newGame
		r.gameName = payload.GameName
		return ""
	case "join":
		if r.game == nil || !r.game.Exists() {
			return "No game to join"
		}
		err := r.game.Join(sender)
		if err != nil {
			return err.Error()
		}
		return r.broadcastGameState()
	case "move":
		if r.game == nil || !r.game.Exists() {
			return "No game in progress"
		}
		if payload.Move == nil {
			return "missing move payload"
		}
		b, err := json.Marshal(payload.Move)
		if err != nil {
			return "invalid move payload: " + err.Error()
		}
		_, err = r.game.Move(sender, b)
		if err != nil {
			return err.Error()
		}
		return r.broadcastGameState()
	default:
		return "unknown action: " + payload.Action
	}
}

func (r *room) broadcastGameState() string {
	state := r.game.State()
	stateBytes, err := json.Marshal(state)
	if err != nil {
		return "failed to marshal game state: " + err.Error()
	}
	msg := &roomMsg{
		Type:    msgGameState,
		Sender:  "_server",
		Payload: stateBytes,
	}
	jsonMsg, err := json.Marshal(msg)
	if err != nil {
		return "failed to marshal game state: " + err.Error()
	}
	r.broadcast(jsonMsg)
	return ""
}
