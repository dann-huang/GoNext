package live

import (
	"encoding/json"
	"errors"
	"letsgo/internal/game"
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

func createMsg(msgType, key, msg string) []byte {
	payload := map[string]string{key: msg}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return internalError(err)
	}
	statusMsg := &roomMsg{
		Type:    msgType,
		Sender:  "_server",
		Payload: json.RawMessage(payloadBytes),
	}
	jsonMessage, err := json.Marshal(statusMsg)
	if err != nil {
		return internalError(err)
	}
	return jsonMessage
}

func createPayloadMsg(msgType string, payload ...any) []byte {
	if len(payload)%2 != 0 {
		return internalError(errors.New("odd number of arguments"))
	}
	payloadMap := make(map[string]any)
	for i := 0; i < len(payload); i += 2 {
		payloadMap[payload[i].(string)] = payload[i+1]
	}
	payloadBytes, err := json.Marshal(payloadMap)
	if err != nil {
		return internalError(err)
	}
	msg := &roomMsg{
		Type:    msgType,
		Sender:  "_server",
		Payload: json.RawMessage(payloadBytes),
	}
	jsonMessage, err := json.Marshal(msg)
	if err != nil {
		return internalError(err)
	}
	return jsonMessage
}
