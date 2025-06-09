// room/client.go
package live

import (
	"context"
	"encoding/json"
	"letsgo/internal/token"
	"log/slog"
	"time"

	"github.com/coder/websocket"
)

type client struct {
	ID     string
	Hub    *hub
	Conn   *websocket.Conn
	Send   chan []byte
	Room   string
	User   *token.UserPayload
	ctx    context.Context
	cancel context.CancelFunc
}

const (
	readTimeout    = 1 * time.Minute
	writeTimeout   = 10 * time.Second
	maxMessageSize = 512
)

func newClient(hub *hub, conn *websocket.Conn, user *token.UserPayload) *client {
	ctx, cancel := context.WithCancel(context.Background())
	return &client{
		ID:     user.Username,
		Hub:    hub,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		User:   user,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (c *client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close(websocket.StatusNormalClosure, "client leaving")
	}()

	for {
		select {
		case <-c.ctx.Done():
			return

		default:
			readCtx, cancelRead := context.WithTimeout(c.ctx, readTimeout)
			msgType, msgRaw, err := c.Conn.Read(readCtx)
			cancelRead()
			if err != nil {
				if websocket.CloseStatus(err) != websocket.StatusNormalClosure &&
					websocket.CloseStatus(err) != websocket.StatusGoingAway {
					slog.Error("ReadPump: WebSocket read error.", "error", err, "clientID", c.ID)
				}
				return
			}
			if msgType != websocket.MessageText {
				errMsg := createMsg("Invalid message type", msgError)
				c.Send <- errMsg
				continue
			}
			if len(msgRaw) > maxMessageSize {
				errMsg := createMsg("Message too large.", msgError)
				c.Send <- errMsg
				continue
			}

			var msg roomMsg
			if err := json.Unmarshal(msgRaw, &msg); err != nil {
				errMsg := createMsg("Invalid message format: "+err.Error(), msgError)
				c.Send <- errMsg
				continue
			}

			msg.SenderID = c.ID

			switch msg.Type {
			case msgChat, msgVidSignal, msgGameState:
				c.Hub.messages <- &msg
			case msgJoinRoom:
				if roomID, ok := msg.Payload.(string); ok && roomID != "" {
					c.Hub.joinRoom <- &crPair{Client: c, RoomName: roomID}
				} else {
					slog.Warn("Join room failed", "clientID", c.ID, "payload", msg.Payload)
					c.Send <- createMsg("Join room failed", msgError)
				}
			case msgLeaveRoom:
				if roomID, ok := msg.Payload.(string); ok && roomID != "" {
					c.Hub.leaveRoom <- &crPair{Client: c, RoomName: roomID}
				} else {
					c.Hub.leaveRoom <- &crPair{Client: c, RoomName: c.Room}
				}
			case msgGetRooms:
				//todo: hand back list of rooms
			case msgGetClients:
				if c.Room != "" {
					if room, ok := c.Hub.rooms[c.Room]; ok {
						c.Send <- room.getClientList()
					}
				}

			default:
				slog.Warn("ReadPump: Unknown message type received.", "type", msg.Type, "clientID", c.ID)
				c.Send <- createMsg("Unknown message type: "+msg.Type, msgError)
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
