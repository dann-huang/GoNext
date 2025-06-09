// room/client.go
package live

import (
	"context"
	"encoding/json"
	"letsgo/internal/config"
	"letsgo/internal/token"
	"log/slog"
	"time"

	"github.com/coder/websocket"
)

type client struct {
	cfg    *config.WS
	ID     string
	Hub    *hub
	Conn   *websocket.Conn
	Send   chan []byte
	Room   string
	User   *token.UserPayload
	ctx    context.Context
	cancel context.CancelFunc
}

func newClient(hub *hub, conn *websocket.Conn, user *token.UserPayload, cfg *config.WS) *client {
	ctx, cancel := context.WithCancel(context.Background())
	return &client{
		cfg:    cfg,
		ID:     user.Username,
		Hub:    hub,
		Conn:   conn,
		Send:   make(chan []byte, cfg.SendBuffer),
		User:   user,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (c *client) start() {
	go c.writePump()
	go c.readPump()
	go c.pingPump()
}

func (c *client) readPump() {
	defer func() {
		c.Hub.unregister <- c
	}()

	for {
		select {
		case <-c.ctx.Done():
			return

		default:
			readCtx, cancelRead := context.WithTimeout(c.ctx, c.cfg.ReadTimeout)
			msgType, msgRaw, err := c.Conn.Read(readCtx)
			cancelRead()
			if err != nil {
				if websocket.CloseStatus(err) != websocket.StatusNormalClosure &&
					websocket.CloseStatus(err) != websocket.StatusGoingAway {
					slog.Error("ReadPump: WebSocket read error.", "error", err, "client", c.ID)
				}
				return
			}
			if msgType != websocket.MessageText {
				c.Send <- createMsg(msgError, "error", "Invalid message type")
				continue
			}
			if len(msgRaw) > int(c.cfg.MaxMsgSize) {
				c.Send <- createMsg(msgError, "error", "Message too large.")
				continue
			}

			var msg roomMsg
			if err := json.Unmarshal(msgRaw, &msg); err != nil {
				c.Send <- createMsg(msgError, "error", "Invalid message format: "+err.Error())
				continue
			}

			msg.SenderID = c.ID

			switch msg.Type {
			case msgChat, msgVidSignal, msgGameState:
				c.Hub.messages <- &msg
			case msgJoinRoom:
				if payloadMap, ok := msg.Payload.(map[string]any); ok {
					if roomID, ok := payloadMap["roomName"].(string); ok && roomID != "" {
						c.Hub.joinRoom <- &crPair{Client: c, RoomName: roomID}
					} else {
						slog.Warn("Join room failed: 'roomName' not found", "payload", msg.Payload)
						c.Send <- createMsg(msgError, "error", "invalid format")
					}
				} else {
					slog.Warn("Join room failed", "client", c.ID, "payload", msg.Payload)
					c.Send <- createMsg(msgError, "error", "invalid format")
				}
			case msgLeaveRoom:
				c.Hub.leaveRoom <- c
			case msgGetRooms:
				//todo: probably remove this, or think about public/private rooms
			case msgGetClients:
				if c.Room != "" {
					if room, ok := c.Hub.rooms[c.Room]; ok {
						c.Send <- room.getClientList()
					}
				}
			default:
				slog.Warn("ReadPump: Unknown message type received.", "type", msg.Type, "client", c.ID)
				c.Send <- createMsg(msgError, "error", "Unknown message type: "+msg.Type)
			}
		}
	}
}

func (c *client) writePump() {
	for {
		select {
		case <-c.ctx.Done():
			return
		case message, ok := <-c.Send:
			writeCtx, cancelWrite := context.WithTimeout(c.ctx, c.cfg.WriteTimeout)
			defer cancelWrite()
			if !ok {
				c.cancel()
				return
			}
			if err := c.Conn.Write(writeCtx, websocket.MessageText, message); err != nil {
				c.cancel()
				return
			}
		}
	}
}

func (c *client) pingPump() {
	ticker := time.NewTicker(c.cfg.PingPeriod)
	defer func() {
		ticker.Stop()
	}()

	for {
		select {
		case <-ticker.C:
			writeCtx, cancelWrite := context.WithTimeout(c.ctx, c.cfg.PingPeriod)
			err := c.Conn.Ping(writeCtx)
			cancelWrite()
			if err != nil {
				slog.Error("Client ping failed", "error", err, "client", c.ID)
				c.cancel()
				return
			}
			slog.Debug("Client pinged", "client", c.ID)
		case <-c.ctx.Done():
			return
		}
	}
}
