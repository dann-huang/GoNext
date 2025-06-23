package live

import (
	"encoding/json"
	"sync"

	"letsgo/internal/game"
)

type room struct {
	registry *game.Registry
	name     string
	clients  map[*client]struct{}
	mu       sync.RWMutex
	game     game.Game
}

func newRoom(name string, registry *game.Registry) *room {
	return &room{
		name:     name,
		clients:  make(map[*client]struct{}),
		mu:       sync.RWMutex{},
		registry: registry,
	}
}

func (r *room) broadcastLocked(msg []byte) {
	for client := range r.clients {
		client.trySend(msg)
	}
}

func (r *room) clientListMsgLocked() [][2]string {
	clientList := make([][2]string, 0, len(r.clients))
	for client := range r.clients {
		clientList = append(clientList, [2]string{client.ID, client.token.Displayname})
	}
	return clientList
}

func (r *room) addClient(client *client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.clients[client] = struct{}{}
	client.room = r
	client.trySend(sendKeyVal(msgJoinRoom, "roomName", r.name))

	r.broadcastLocked(sendMessage(msgStatus, client.token.Displayname+" has joined "+r.name))
	r.broadcastLocked(sendKeyVal(msgGetClients,
		"clients", r.clientListMsgLocked()))
}

func (r *room) removeClient(client *client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.clients[client]; ok {
		if r.game != nil {
			r.game.Leave(client.ID, false)
		}
		delete(r.clients, client)

		r.broadcastLocked(sendMessage(msgStatus, client.token.Displayname+" has left "+r.name))
		r.broadcastLocked(sendKeyVal(msgGetClients,
			"clients", r.clientListMsgLocked()))
	}
}

func (r *room) handleRelay(msg *roomMsg) {
	jsonMsg, err := json.Marshal(msg)
	if err != nil {
		msg.Client.trySend(internalError(err))
		return
	}
	r.mu.RLock()
	r.broadcastLocked(jsonMsg)
	r.mu.RUnlock()
}

func (r *room) handleGameUpdate(update game.GameUpdate) {
	switch update.Action {
	case game.UpdateAction:
		r.broadcastLocked(r.sendGameState(update.State))
	case game.DeleteAction:
		r.broadcastLocked(r.sendGameState(update.State))
		r.game = nil
	}
}

func (r *room) handleGameState(client *client, payload *GameMessagePayload) {
	switch payload.Action {
	case "get":
		if r.game != nil {
			client.trySend(r.sendGameState(r.game.GetState()))
		}
	case "create":
		r.mu.Lock()
		defer r.mu.Unlock()
		if r.game == nil {
			newGame, err := r.registry.Create(payload.GameName, r.handleGameUpdate)
			if err != nil {
				client.trySend(sendMessage(msgError, "Invalid game name: "+payload.GameName))
				return
			}
			r.game = newGame
			r.game.Join(client.ID)
			r.game.Start()
		}
	case "join":
		r.mu.RLock()
		defer r.mu.RUnlock()
		if r.game != nil {
			if err := r.game.Join(client.ID); err != nil {
				client.trySend(sendMessage(msgError, err.Error()))
			}
		}
	case "move":
		r.mu.RLock()
		defer r.mu.RUnlock()
		if r.game != nil {
			if err := r.game.Move(client.ID, payload.Move); err != nil {
				client.trySend(sendMessage(msgError, err.Error()))
			}
		}
	case "leave":
		r.mu.RLock()
		defer r.mu.RUnlock()
		if r.game != nil {
			r.game.Leave(client.ID, true)
		}
	default:
		client.trySend(sendMessage(msgError, "unknown action: "+payload.Action))
	}
}

func (r *room) sendGameState(state *game.GameState) []byte {
	stateBytes, err := json.Marshal(state)
	if err != nil {
		return r.panicReset()
	}
	return sendBytes(msgGameState, stateBytes)
}

func (r *room) panicReset() []byte {
	r.mu.Lock()
	defer r.mu.Unlock()

	errorMsg := []byte(`{"type":"error","sender":"_server","payload":"Game state corrupted, resetting..."}`)
	cleanStateMsg := []byte(`{"type":"game_state","sender":"_server","payload":"{\"status\":\"waiting\",\"players\":[],\"turn\":0,\"board\":null,\"winner\":\"\"}"}`)

	r.game = nil
	r.broadcastLocked(errorMsg)
	r.broadcastLocked(cleanStateMsg)
	return cleanStateMsg
}
