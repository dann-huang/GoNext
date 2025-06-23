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
	recv   chan []byte
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
		recv:   make(chan []byte, cfg.RecvBuffer),
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

	go c.processPump()
}

func (c *client) stop() {
	c.cancel()
	c.hub.unregister <- c
	close(c.send)
	close(c.recv)
	c.conn.Close(websocket.StatusNormalClosure, "client leaving")
}

func (c *client) readPump() {
	defer c.stop()

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
			c.trySend(createMsg(msgError, "message", "Invalid message type"))
			continue
		}
		if len(msgRaw) > int(c.cfg.MaxMsgSize) {
			c.trySend(createMsg(msgError, "message", "Message too large."))
			continue
		}

		select {
		case <-c.ctx.Done():
			slog.Info("readPump: Context cancelled during send to recv channel", "client", c.ID)
			return
		case c.recv <- msgRaw:
		default:
			slog.Error("readPump: Client recv queue full", "client", c.ID)
			c.trySend(createMsg(msgError, "message", "Server busy. Please try again later."))
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

func (c *client) processPump() {
	for {
		select {
		case <-c.ctx.Done():
			return
		case msgRaw := <-c.recv:
			var msg roomMsg
			if err := json.Unmarshal(msgRaw, &msg); err != nil {
				c.trySend(createMsg(msgError, "message", "Invalid message format: "+err.Error()))
				continue
			}

			msg.Sender = c.ID
			msg.Client = c
			switch msg.Type {
			case msgChat, msgVidSignal, msgRawSignal:
				c.room.handleRelay(&msg)
			case msgGameState:
				var payload GameMessagePayload
				if err := json.Unmarshal(msg.Payload, &payload); err != nil {
					c.trySend(createMsg(msgError, "message", "Invalid payload format: "+err.Error()))
					continue
				}
				c.room.handleGameState(c, &payload)

			case msgJoinRoom:
				var payload JoinRoomPayload
				if err := json.Unmarshal(msg.Payload, &payload); err == nil {
					if roomID := payload.RoomName; roomID != "" {
						c.hub.joinRoom <- &crPair{Client: c, RoomName: roomID}
					} else {
						c.trySend(createMsg(msgError, "message", "invalid format: missing roomName"))
					}
				} else {
					c.trySend(createMsg(msgError, "message", "invalid format for join room"))
				}
			case msgLeaveRoom:
				c.hub.leaveRoom <- c
			default:
				slog.Warn("processPump: Unknown message type received", "type", msg.Type, "client", c.ID)
				c.trySend(createMsg(msgError, "message", "Unknown message type: "+msg.Type))
			}
		}
	}
}

func (c *client) trySend(msg []byte) {
	select {
	case c.send <- msg:
	default:
		slog.Warn("trySend: Client send queue full", "client", c.ID)
	}
}
