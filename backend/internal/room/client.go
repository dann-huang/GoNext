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

type client struct {
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

func newClient(hub *Hub, conn *websocket.Conn, name string) *client {
	ctx, cancel := context.WithCancel(context.Background())
	return &client{
		ID:     uuid.New().String(),
		Hub:    hub,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		Name:   name,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (c *client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close(websocket.StatusNormalClosure, "client leaving")
	}()

	for {
		select {
		case <-c.ctx.Done():
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
				errMsg := createMsg("Invalid message type", "", msgError)
				c.Send <- errMsg
				continue
			}
			if len(message) > maxMessageSize {
				errMsg := createMsg("Message too large.", "", msgError)
				c.Send <- errMsg
				continue
			}

			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				errMsg := createMsg("Invalid message format: "+err.Error(), "", msgError)
				c.Send <- errMsg
				continue
			}

			msg.SenderID = c.ID
			msg.Sender = c.Name
			if msg.RoomName == "" {
				msg.RoomName = c.Room
			}

			switch msg.Type {
			case msgChat, msgVidSignal, msgGameState:
				c.Hub.Messages <- &msg
			case msgCreateRoom:
				if roomName, ok := msg.Payload.(string); ok && roomName != "" {
					c.Hub.CreateRoom <- roomName
				} else {
					slog.Warn("Create room request with invalid room name payload.", "clientID", c.ID, "payload", msg.Payload)
					c.Send <- createMsg("Invalid room name for creation.", "", msgError)
				}
			case msgJoinRoom:
				if roomID, ok := msg.Payload.(string); ok && roomID != "" {
					c.Hub.JoinRoom <- &crPair{Client: c, RoomName: roomID}
				} else {
					slog.Warn("Join room request with invalid room ID payload.", "clientID", c.ID, "payload", msg.Payload)
					c.Send <- createMsg("Invalid room ID for joining.", "", msgError)
				}
			case msgLeaveRoom:
				if roomID, ok := msg.Payload.(string); ok && roomID != "" {
					c.Hub.LeaveRoom <- &crPair{Client: c, RoomName: roomID}
				} else {
					// If no specific room ID is provided, assume leaving the current room
					c.Hub.LeaveRoom <- &crPair{Client: c, RoomName: c.Room}
				}
			case msgGetRooms:
				// Client requests a list of rooms. Hub should handle this and send back.
				slog.Info("Client requested room list. Hub needs to implement sending this back.", "clientID", c.ID)
				// To implement this, you'd add a new channel to your Hub like `GetRoomListRequests chan *Client`
				// and then in the Hub's Run loop, handle it by sending a marshaled list of rooms back to client.Send.
			case msgGetClients:
				if c.Room != "" {
					if room, ok := c.Hub.Rooms[c.Room]; ok {
						c.Send <- room.getClientList()
					}
				}

			default:
				slog.Warn("ReadPump: Unknown message type received.", "type", msg.Type, "clientID", c.ID)
				c.Send <- createMsg("Unknown message type: "+msg.Type, "", msgError)
			}
		}
	}
}

func (c *client) writePump() {
	defer func() {
		c.Conn.Close(websocket.StatusNormalClosure, "shutting down")
	}()

	for {
		select {
		case <-c.ctx.Done():
			return
		case message, ok := <-c.Send:
			writeCtx, cancelWrite := context.WithTimeout(c.ctx, writeTimeout)
			defer cancelWrite()

			if !ok {
				return
			}
			if err := c.Conn.Write(writeCtx, websocket.MessageText, message); err != nil {
				return
			}
		}
	}
}
