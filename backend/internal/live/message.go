package live

import (
	"encoding/json"
)

const (
	msgError      = "error"
	msgStatus     = "status"
	msgChat       = "chat"
	msgVidSignal  = "video_signal"
	msgGameState  = "game_state"
	msgJoinRoom   = "join_room"
	msgLeaveRoom  = "leave_room"
	msgGetRooms   = "get_rooms"
	msgGetClients = "get_clients"
)

// GameMessagePayload is the strongly typed payload for game messages
// Action is one of: "create", "join", "move"
type GameMessagePayload struct {
	Action   string             `json:"action"`
	GameName string             `json:"gameName,omitempty"`
	Create   *GameCreatePayload `json:"create,omitempty"`
	Move     *GameMovePayload   `json:"move,omitempty"`
}

type GameCreatePayload struct {
	// For connect4, this is empty or could add custom options later
}

type GameMovePayload struct {
	// For connect4
	Col int `json:"col"`
	// For chess, could add From/To squares, promotion, etc
}

type roomMsg struct {
	Type    string          `json:"type"`
	Sender  string          `json:"sender,omitempty"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type crPair struct {
	Client   *client
	RoomName string
}

func createMsg(msgType, key, msg string) []byte {
	payload := map[string]string{key: msg}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return []byte(`{"type":"error","payload":{"message":"Internal server error"}}`)
	}
	statusMsg := &roomMsg{
		Type:    msgType,
		Sender:  "_server",
		Payload: json.RawMessage(payloadBytes),
	}
	jsonMessage, err := json.Marshal(statusMsg)
	if err != nil {
		return []byte(`{"type":"error","payload":{"message":"Internal server error"}}`)
	}
	return jsonMessage
}
