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
	hub    *hub
	conn   *websocket.Conn
	send   chan []byte
	room   *room
	token  *token.UserPayload
	ctx    context.Context
	cancel context.CancelFunc
}

func newClient(h *hub, conn *websocket.Conn, token *token.UserPayload, cfg *config.WS) *client {
	ctx, cancel := context.WithCancel(context.Background())
	return &client{
		cfg:    cfg,
		ID:     token.Username,
		hub:    h,
		conn:   conn,
		send:   make(chan []byte, cfg.SendBuffer),
		token:  token,
		ctx:    ctx,
		cancel: cancel,
		room:   nil,
	}
}

func (c *client) start() {
	go c.writePump()
	go c.readPump()
	go c.pingPump()
}

func (c *client) readPump() {
	defer func() {
		c.hub.unregister <- c
	}()

	for {
		msgType, msgRaw, err := c.conn.Read(c.ctx)
		if err != nil {
			if websocket.CloseStatus(err) != websocket.StatusNormalClosure &&
				websocket.CloseStatus(err) != websocket.StatusGoingAway {
				slog.Error("readPump: WebSocket read error", "error", err, "client", c.ID)
			}
			break
		}
		if msgType != websocket.MessageText {
			slog.Error("readPump: unhandled message type", "msgType", msgType.String())
			c.send <- createMsg(msgError, "message", "Invalid message type")
			continue
		}
		if len(msgRaw) > int(c.cfg.MaxMsgSize) {
			c.send <- createMsg(msgError, "message", "Message too large.")
			continue
		}
		var msg roomMsg
		if err := json.Unmarshal(msgRaw, &msg); err != nil {
			c.send <- createMsg(msgError, "message", "Invalid message format: "+err.Error())
			continue
		}

		msg.Sender = c.ID
		msg.Client = c

		switch msg.Type {
		case msgChat, msgVidSignal, msgRawSignal:
			msg.Sender = c.ID
			jsonMsg, err := json.Marshal(msg)
			if err != nil {
				c.send <- createMsg(msgError, "message", "Failed to marshal message: "+err.Error())
				continue
			}
			c.room.broadcast(jsonMsg)

		case msgGameState:
			msg.Sender = c.ID
			if errStr := c.room.handleGameState(&msg); errStr != "" {
				c.send <- createMsg(msgError, "message", "Failed to handle game state: "+errStr)
			}

		//Hub actions
		case msgJoinRoom:
			var payloadMap map[string]any
			if err := json.Unmarshal(msg.Payload, &payloadMap); err == nil {
				if roomID, ok := payloadMap["roomName"].(string); ok && roomID != "" {
					c.hub.joinRoom <- &crPair{Client: c, RoomName: roomID}
				} else {
					c.send <- createMsg(msgError, "message", "invalid format: missing roomName")
				}
			} else {
				c.send <- createMsg(msgError, "message", "invalid format for join room")
			}
		case msgLeaveRoom:
			c.hub.leaveRoom <- c
		case msgGetClients:
			if c.room != nil {
				c.send <- c.room.getClientList()
			}
		default:
			slog.Warn("readPump: Unknown message type received", "type", msg.Type, "client", c.ID)
			c.send <- createMsg(msgError, "message", "Unknown message type: "+msg.Type)
		}
	}
}

func (c *client) writePump() {
	for {
		select {
		case <-c.ctx.Done():
			return
		case message, ok := <-c.send:
			if !ok {
				c.cancel()
				return
			}
			writeCtx, cancelWrite := context.WithTimeout(c.ctx, c.cfg.WriteTimeout)
			err := c.conn.Write(writeCtx, websocket.MessageText, message)
			cancelWrite()
			if err != nil {
				slog.Error("writePump: WebSocket write error", "error", err, "client", c.ID)
				c.cancel()
				return
			}
		}
	}
}

func (c *client) pingPump() {
	ticker := time.NewTicker(c.cfg.PongTimeout)
	defer ticker.Stop()

	for {
		select {
		case <-c.ctx.Done():
			return
		case <-ticker.C:
			pingCtx, cancelPing := context.WithTimeout(c.ctx, c.cfg.PongTimeout)
			err := c.conn.Ping(pingCtx)
			cancelPing()
			if err != nil {
				slog.Error("Client ping failed", "error", err, "client", c.ID)
				c.cancel()
				return
			}
		}
	}
}
