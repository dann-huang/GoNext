package room

import (
	"encoding/json"
)

const (
	msgError      = "error"
	msgStatus     = "status"
	msgChat       = "chat"
	msgVidSignal  = "video_signal"
	msgGameState  = "game_state"
	msgCreateRoom = "create_room"
	msgJoinRoom   = "join_room"
	msgLeaveRoom  = "leave_room"
	msgGetRooms   = "get_rooms"
	msgGetClients = "get_clients"
)

type roomMsg struct {
	Type     string `json:"type"`
	RoomName string `json:"roomId,omitempty"`
	Sender   string `json:"name,omitempty"`
	SenderID string `json:"senderId,omitempty"`
	Payload  any    `json:"payload"`
}

type crPair struct {
	Client   *client
	RoomName string
}

func createMsg(msg, roomName string, msgType string) []byte {
	statusMsg := &roomMsg{
		Type:     msgType,
		RoomName: roomName,
		Payload:  map[string]string{"status": msg},
	}
	jsonMessage, err := json.Marshal(statusMsg)
	if err != nil {
		return []byte(`{"type":"error","payload":{"error":"Internal server error"}}`)
	}
	return jsonMessage
}
