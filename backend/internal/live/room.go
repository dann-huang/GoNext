// room/room.go
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

func (r *room) broadcast(msg []byte) {
	r.mu.RLock()
	r.broadcastLocked(msg)
	r.mu.RUnlock()
}

func (r *room) broadcastLocked(msg []byte) {
	for client := range r.clients {
		client.trySend(msg)
	}
}

func (r *room) getClientList() []byte {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return createPayloadMsg(msgGetClients,
		"clients", r.clientListMsgLocked())
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
	client.trySend(createMsg(msgJoinRoom, "roomName", r.name))

	r.broadcastLocked(createMsg(msgStatus, "message",
		client.token.Displayname+" has joined "+r.name))
	r.broadcastLocked(createPayloadMsg(msgGetClients,
		"clients", r.clientListMsgLocked()))
}

func (r *room) removeClient(client *client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.clients[client]; ok {
		if r.game != nil {
			if r.game.Leave(client.ID, false) {
				r.game = nil
			}
		}
		delete(r.clients, client)

		r.broadcastLocked(createMsg(msgStatus, "message",
			client.token.Displayname+" has left "+r.name))
		r.broadcastLocked(createPayloadMsg(msgGetClients,
			"clients", r.clientListMsgLocked()))
	}
}

func (r *room) handleGameState(msg *roomMsg) string {
	r.mu.Lock()
	defer r.mu.Unlock()

	var payload GameMessagePayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		return "invalid payload: " + err.Error()
	}

	switch payload.Action {
	case "get":

		return ""
	case "create":

		return ""
	case "join":

		return ""
	case "move":

		return ""
	case "leave":

		return ""
	default:
		return "unknown action: " + payload.Action
	}
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
