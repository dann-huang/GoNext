// room/room.go
package live

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"letsgo/internal/game"
)

type room struct {
	registry *game.Registry
	name     string
	clients  map[*client]struct{}
	mu       sync.RWMutex
	game     game.Game
	done     chan struct{}
}

func newRoom(name string, registry *game.Registry) *room {
	r := &room{
		name:     name,
		clients:  make(map[*client]struct{}),
		mu:       sync.RWMutex{},
		registry: registry,
		done:     make(chan struct{}),
	}
	go r.run()
	return r
}

func (r *room) run() {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			r.mu.Lock()
			if r.game != nil {
				if _, changed := r.game.Tick(); changed {
					msg, err := r.gameStateMsg()
					if err != nil {
						slog.Error("gameStateMsg failed", "error", err)
					} else {
						r.broadcast(msg)
					}
				}
			}
			r.mu.Unlock()
		case <-r.done:
			return
		}
	}
}

func (r *room) addClient(client *client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.clients[client] = struct{}{}
	client.room = r
	client.send <- createMsg(msgJoinRoom, "roomName", r.name)

	r.broadcast(createMsg(msgStatus, "message", client.token.Displayname+" has joined "+r.name))
	r.broadcast(r.getClientList())
}

func (r *room) removeClient(client *client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.clients[client]; ok {
		if r.game != nil {
			if r.game.Leave(client.ID) {
				r.game = nil
			}
		}
		delete(r.clients, client)

		r.broadcast(createMsg(msgStatus, "message", client.token.Displayname+" has left "+r.name))
		r.broadcast(r.getClientList())
	}
}

func (r *room) broadcast(msg []byte) {
	for client := range r.clients {
		select {
		case client.send <- msg:
		default:
			slog.Warn("Invalid client.", "client", client.ID, "roomID", r.name)
		}
	}
}

func (r *room) getClientList() []byte {
	clientNames := make([]string, 0, len(r.clients))
	for client := range r.clients {
		clientNames = append(clientNames, client.token.Displayname)
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
	case "get":
		jsonMsg, err := r.gameStateMsg()
		if err != nil {
			return "failed to get game state: " + err.Error()
		}
		msg.Client.send <- jsonMsg
		return ""
	case "create":
		if r.game != nil {
			return "Game already exists in this room"
		}
		newGame, err := r.registry.Create(payload.GameName, sender, nil)
		if err != nil {
			return err.Error()
		}
		r.game = newGame
		msg, err := r.gameStateMsg()
		if err != nil {
			return "failed to get game state: " + err.Error()
		}
		r.broadcast(msg)
		return ""
	case "join":
		if r.game == nil {
			return "No game to join"
		}
		err := r.game.Join(sender)
		if err != nil {
			return err.Error()
		}
		msg, err := r.gameStateMsg()
		if err != nil {
			return "failed to get game state: " + err.Error()
		}
		r.broadcast(msg)
		return ""
	case "move":
		if r.game == nil {
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
		msg, err := r.gameStateMsg()
		if err != nil {
			return "failed to get game state: " + err.Error()
		}
		r.broadcast(msg)
		return ""
	case "leave":
		if r.game == nil {
			return "No game in progress"
		}
		// Remove the player from the game
		if r.game.Leave(sender) {
			// If the game is empty after leaving, remove it
			r.game = nil
		}
		// Broadcast the updated game state
		msg, err := r.gameStateMsg()
		if err != nil {
			return "failed to get game state: " + err.Error()
		}
		r.broadcast(msg)
		return ""
	default:
		return "unknown action: " + payload.Action
	}
}

func (r *room) gameStateMsg() ([]byte, error) {
	var state *game.GameState

	if r.game != nil {
		state = r.game.State()
	} else {
		state = &game.GameState{
			Status:  game.StatusWaiting,
			Players: []string{},
		}
	}
	stateBytes, err := json.Marshal(state)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal game state: %w", err)
	}

	msg := &roomMsg{
		Type:    msgGameState,
		Sender:  "_server",
		Payload: json.RawMessage(stateBytes),
	}
	jsonMsg, err := json.Marshal(msg)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal message: %w", err)
	}
	return jsonMsg, nil
}
