package room

import (
	"encoding/json"
)

const (
	msgError      = "error"        // For sending error messages to clients
	msgStatus     = "status"       // For general status updates (e.g., join/leave messages)
	msgChat       = "chat"         // For regular chat messages
	msgVidSignal  = "video_signal" // For WebRTC signaling data (e.g., ICE candidates, SDP offers/answers)
	msgGameState  = "game_state"   // For game-specific data
	msgCreateRoom = "create_room"  // Client request to create a room
	msgJoinRoom   = "join_room"    // Client request to join a room
	msgLeaveRoom  = "leave_room"   // Client request to leave a room
	msgGetRooms   = "get_rooms"    // Server sends list of available rooms
	msgGetClients = "get_clients"  // Server sends list of clients in a room
)

type Message struct {
	Type     string `json:"type"`
	RoomID   string `json:"roomId,omitempty"`
	Sender   string `json:"name,omitempty"`
	SenderID string `json:"senderId,omitempty"`
	Payload  any    `json:"payload"`
}

type ClientRoomPair struct {
	Client *Client
	RoomID string
}

func createMsg(msg, roomID string, msgType string) []byte {
	statusMsg := &Message{
		Type:    msgType,
		RoomID:  roomID,
		Payload: map[string]string{"status": msg},
	}
	jsonMessage, err := json.Marshal(statusMsg)
	if err != nil {
		return []byte(`{"type":"error","payload":{"error":"Internal server error"}}`)
	}
	return jsonMessage
}
