package live

import (
	"encoding/json"
	"errors"
	"gonext/internal/game"
	"log/slog"
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
	Action   string         `json:"action"`
	GameName string         `json:"gameName,omitempty"`
	Move     *game.GameMove `json:"move,omitempty"`
}

type JoinRoomPayload struct {
	RoomName string `json:"roomName"`
}

type crPair struct {
	Client   *client
	RoomName string
}

func internalError(err error) []byte {
	slog.Error("internalError", "error", err)
	return []byte(`{"type":"error","sender":"_server","payload":{"message":"Internal server error"}}`)
}

func sendMessage(msgType, msg string) []byte {
	return sendKeyVal(msgType, "message", msg)
}

func sendKeyVal(msgType string, keyVal ...any) []byte {
	if len(keyVal)%2 != 0 {
		return internalError(errors.New("odd number of arguments"))
	}
	payloadMap := make(map[string]any)
	for i := 0; i < len(keyVal); i += 2 {
		payloadMap[keyVal[i].(string)] = keyVal[i+1]
	}
	payloadBytes, err := json.Marshal(payloadMap)
	if err != nil {
		return internalError(err)
	}
	return sendBytes(msgType, payloadBytes)
}

func sendBytes(msgType string, bytes []byte) []byte {
	msg := &roomMsg{
		Type:    msgType,
		Sender:  "_server",
		Payload: bytes,
	}
	jsonMessage, err := json.Marshal(msg)
	if err != nil {
		return internalError(err)
	}
	return jsonMessage
}
