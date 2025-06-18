package live

import (
	"encoding/json"
	"letsgo/internal/game"
)

const (
	msgError      = "error"
	msgStatus     = "status"
	msgChat       = "chat"
	msgVidSignal  = "video_signal"
	msgRawSignal  = "raw_signal"
	msgGameState  = "game_state"
	msgJoinRoom   = "join_room"
	msgLeaveRoom  = "leave_room"
	msgGetRooms   = "get_rooms"
	msgGetClients = "get_clients"
)

type roomMsg struct {
	Type    string          `json:"type"`
	Sender  string          `json:"sender,omitempty"`
	Client  *client         `json:"-"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type GameMessagePayload struct {
	Action   string                `json:"action"`
	GameName string                `json:"gameName,omitempty"`
	Move     *game.GameMovePayload `json:"move,omitempty"`
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
