// room/utils.go
package room

import (
	"encoding/json"
	"log/slog"
)

func createErrorMessage(msg string, roomID string) []byte {
	errMsg := Message{
		Type:    MessageTypeError,
		RoomID:  roomID,
		Payload: msg,
	}
	jsonMsg, err := json.Marshal(errMsg)
	if err != nil {
		slog.Error("Failed to marshal error message.", "error", err, "originalMsg", msg)
		return []byte(`{"type":"error","payload":"Internal server error"}`)
	}
	return jsonMsg
}

// TODO: Add other helper functions here later, such as:
// createStatusMessage(msg string, roomID string) []byte
// createClientListMessage(room *Room) ([]byte, error)
// getRoomListMessage(h *Hub) ([]byte, error)
