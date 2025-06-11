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

type roomMsg struct {
	Type    string `json:"type"`
	Sender  string `json:"sender,omitempty"`
	Payload any    `json:"payload"`
}

type crPair struct {
	Client   *client
	RoomName string
}

func createMsg(msgType, key, msg string) []byte {
	statusMsg := &roomMsg{
		Type:    msgType,
		Sender:  "_server",
		Payload: map[string]string{key: msg},
	}
	jsonMessage, err := json.Marshal(statusMsg)
	if err != nil {
		return []byte(`{"type":"error","payload":{"error":"Internal server error"}}`)
	}
	return jsonMessage
}
