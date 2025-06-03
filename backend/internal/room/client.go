// room/client.go
package room

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/coder/websocket"
	"github.com/google/uuid"
)

type Client struct {
	ID     string
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan []byte
	Room   string
	Name   string
	ctx    context.Context
	cancel context.CancelFunc
}

const (
	readTimeout    = 1 * time.Minute
	writeTimeout   = 10 * time.Second
	maxMessageSize = 512
)

// NewClient creates a new Client instance.
func NewClient(hub *Hub, conn *websocket.Conn, name string) *Client {
	ctx, cancel := context.WithCancel(context.Background())
	return &Client{
		ID:     uuid.New().String(), // Generate a unique ID for the client
		Hub:    hub,
		Conn:   conn,
		Send:   make(chan []byte, 256), // Buffered channel for outbound messages
		Name:   name,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (c *Client) ReadPump() {
	slog.Info("ReadPump start", "clientName", c.Name)
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close(websocket.StatusNormalClosure, "client leaving")
		slog.Info("ReadPump stopped for client.", "clientName", c.Name)
	}()

	for {
		select {
		case <-c.ctx.Done():
			slog.Info("ReadPump: context cancelled,", "clientName", c.Name)
			return
		default:
			readCtx, cancelRead := context.WithTimeout(c.ctx, readTimeout)
			msgType, message, err := c.Conn.Read(readCtx)
			cancelRead()

			if err != nil {
				if websocket.CloseStatus(err) != websocket.StatusNormalClosure &&
					websocket.CloseStatus(err) != websocket.StatusGoingAway {
					slog.Error("ReadPump: WebSocket read error.", "error", err, "clientID", c.ID)
				}
				return
			}

			if msgType != websocket.MessageText {
				slog.Warn("ReadPump: Received non-text message type. Skipping.", "msgType", msgType, "clientID", c.ID)
				continue
			}

			if len(message) > maxMessageSize {
				slog.Warn("ReadPump: Received message exceeding max size. Skipping.", "size", len(message), "maxSize", maxMessageSize, "clientID", c.ID)
				errMsg := createMsg("Message too large.", "", msgError)
				c.Send <- errMsg
				continue
			}

			// Unmarshal the incoming message to a Message struct
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				slog.Error("ReadPump: Error unmarshaling inbound message.", "error", err, "message", string(message), "clientID", c.ID)
				// Send an error message back to the client if parsing fails
				errMsg := createMsg("Invalid message format: "+err.Error(), "", msgError)
				c.Send <- errMsg
				continue
			}

			msg.SenderID = c.ID // Set the sender ID
			msg.Sender = c.Name // Set the sender name
			if msg.RoomID == "" {
				msg.RoomID = c.Room // Default to current room if not specified
			}

			// Handle different message types
			switch msg.Type {
			case msgChat, msgVidSignal, msgGameState:
				slog.Debug("broadcasting msg:", "queue", &c.Hub.Messages)
				c.Hub.Messages <- &msg
				slog.Debug("broadcasted msg:", "msg", msg)
			case msgCreateRoom:
				if roomName, ok := msg.Payload.(string); ok && roomName != "" {
					c.Hub.CreateRoom <- roomName
				} else {
					slog.Warn("Create room request with invalid room name payload.", "clientID", c.ID, "payload", msg.Payload)
					c.Send <- createErrorMessage("Invalid room name for creation.", "")
				}
			case msgJoinRoom:
				if roomID, ok := msg.Payload.(string); ok && roomID != "" {
					c.Hub.JoinRoom <- &ClientRoomPair{Client: c, RoomID: roomID}
				} else {
					slog.Warn("Join room request with invalid room ID payload.", "clientID", c.ID, "payload", msg.Payload)
					c.Send <- createErrorMessage("Invalid room ID for joining.", "")
				}
			case msgLeaveRoom:
				if roomID, ok := msg.Payload.(string); ok && roomID != "" {
					c.Hub.LeaveRoom <- &ClientRoomPair{Client: c, RoomID: roomID}
				} else {
					// If no specific room ID is provided, assume leaving the current room
					c.Hub.LeaveRoom <- &ClientRoomPair{Client: c, RoomID: c.Room}
				}
			case msgGetRooms:
				// Client requests a list of rooms. Hub should handle this and send back.
				slog.Info("Client requested room list. Hub needs to implement sending this back.", "clientID", c.ID)
				// To implement this, you'd add a new channel to your Hub like `GetRoomListRequests chan *Client`
				// and then in the Hub's Run loop, handle it by sending a marshaled list of rooms back to client.Send.
			case msgGetClients:
				// Client requests a list of clients in the current room.
				slog.Info("Client requested client list. Room broadcast upon join/leave.", "clientID", c.ID)
				if c.Room != "" {
					if room, ok := c.Hub.Rooms[c.Room]; ok {
						c.Send <- getClientList(room)
					}
				}

			default:
				slog.Warn("ReadPump: Unknown message type received.", "type", msg.Type, "clientID", c.ID)
				c.Send <- createMsg("Unknown message type: "+msg.Type, "", msgError)
			}
		}
	}
}

func (c *Client) WritePump() {
	slog.Info("Writepump start", "clientName", c.Name)
	defer func() {
		c.Conn.Close(websocket.StatusNormalClosure, "shutting down")
		slog.Info("WritePump stopped for client.", "clientID", c.ID, "clientName", c.Name)
	}()

	for {
		select {
		case <-c.ctx.Done():
			slog.Info("WritePump: Client context", "clientID", c.ID)
			return
		case message, ok := <-c.Send:
			slog.Debug("write start")
			writeCtx, cancelWrite := context.WithTimeout(c.ctx, writeTimeout)
			defer cancelWrite() // Always cancel the context to release resources

			if !ok {
				// The hub closed the channel.
				slog.Info("WritePump: Client send channel closed, closing connection.", "clientID", c.ID)
				return // Exit the write pump
			}

			// Write the message as text
			if err := c.Conn.Write(writeCtx, websocket.MessageText, message); err != nil {
				slog.Error("WritePump: Failed to write message to WebSocket.", "error", err, "clientID", c.ID)
				return // Exit the write pump on error
			}

			slog.Debug("Message sent to client.", "clientID", c.ID, "messageSize", len(message))

			// Optional: Drain any immediately available messages from the channel
			// This is an optimization to send multiple messages in quick succession
			// without incurring multiple Write calls if the buffer fills up.
			// However, with context-based writes, it's often simpler to just send one by one.
			// for i := 0; i < len(c.Send); i++ {
			// 	select {
			// 	case nextMessage := <-c.Send:
			// 		if err := c.Conn.Write(writeCtx, websocket.MessageText, nextMessage); err != nil {
			// 			slog.Error("WritePump: Failed to write subsequent message.", "error", err, "clientID", c.ID)
			// 			return
			// 		}
			// 	default:
			// 		break // No more messages immediately available
			// 	}
			// }
		}
	}
}
