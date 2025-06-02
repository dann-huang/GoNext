// room/types.go
package room

import (
	"context" // Needed for context.Context in Client struct

	"github.com/coder/websocket" // Needed for websocket.Conn in Client struct
)

// Constants for message types
// Defining these as constants makes your code more readable and less prone to typos.
const (
	MessageTypeError       = "error"        // For sending error messages to clients
	MessageTypeStatus      = "status"       // For general status updates (e.g., join/leave messages)
	MessageTypeChat        = "chat"         // For regular chat messages
	MessageTypeVideoSignal = "video_signal" // For WebRTC signaling data (e.g., ICE candidates, SDP offers/answers)
	MessageTypeGameState   = "game_state"   // For game-specific data
	MessageTypeCreateRoom  = "create_room"  // Client request to create a room
	MessageTypeJoinRoom    = "join_room"    // Client request to join a room
	MessageTypeLeaveRoom   = "leave_room"   // Client request to leave a room
	MessageTypeRoomList    = "room_list"    // Server sends list of available rooms
	MessageTypeClientList  = "client_list"  // Server sends list of clients in a room
)

// Message represents a message exchanged between clients or the server.
// The `json:"..."` tags tell the `encoding/json` package how to
// convert the Go struct fields to JSON keys (camelCase is typical for JSON).
type Message struct {
	Type     string      `json:"type"`               // e.g., "chat", "video_signal", "game_state", "room_list", "error"
	RoomID   string      `json:"roomId,omitempty"`   // Which room this message pertains to (omitempty means omit if empty)
	Sender   string      `json:"name,omitempty"`     // Username of the client who sent the message
	SenderID string      `json:"senderId,omitempty"` // ID of the client who sent the message
	Payload  interface{} `json:"payload"`            // The actual content of the message. `interface{}` allows any JSON type (string, number, object, array).
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	ID     string
	Hub    *Hub            // Reference to the Hub this client belongs to
	Conn   *websocket.Conn // The actual WebSocket connection (`coder/websocket.Conn`)
	Send   chan []byte     // Buffered channel of outbound messages. Messages are put here to be sent to the client.
	RoomID string          // Current room the client is in (empty string if not in a room)
	Name   string

	// ctx and cancel are used for managing the lifecycle of the client's goroutines (readPump/writePump).
	// When `cancel()` is called, `ctx.Done()` closes, signaling the goroutines to shut down.
	ctx    context.Context
	cancel context.CancelFunc
}

// Room represents a chat room where multiple clients can send and receive messages.
type Room struct {
	ID      string
	Name    string
	Clients map[string]*Client // Clients currently in this room (map: ClientID -> *Client)
	// You might add other fields here later, e.g., RoomOwnerID, CreationTime, etc.
}

// ClientRoomPair is a helper struct used for channels that deal with a client
// wanting to join or leave a specific room.
type ClientRoomPair struct {
	Client *Client
	RoomID string
}
