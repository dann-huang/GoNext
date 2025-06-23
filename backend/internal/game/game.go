package game

import (
	"context"
	"errors"
	"slices"
	"sync"
	"time"
)

type GameAction int

const (
	StatusWaiting      = "waiting"
	StatusInProgress   = "in_progress"
	StatusFin          = "finished"
	StatusDisconnected = "disconnected"

	DisconnectTimeout = 30 * time.Second
	CleanupDelay      = 10 * time.Second
	TickInterval      = 1 * time.Second

	UpdateAction GameAction = iota
	DeleteAction
)

type Position struct {
	Row int `json:"row"`
	Col int `json:"col"`
}

type GameMove struct {
	From   Position `json:"from"`
	To     Position `json:"to"`
	Change string   `json:"change,omitempty"`
}

type Game interface {
	Join(player string) error
	Rejoin(player string)
	Leave(player string, intentional bool)
	Move(player string, mv *GameMove) error
	Start()
	Stop()

	GetState() *GameState
	getBoardLocked() any
	getValidMovesLocked() []GameMove
	updateLoop()
	handleDisconnects()
}

type GameUpdate struct {
	State  *GameState
	Action GameAction
}

type GameState struct {
	GameName   string     `json:"gameName"`
	Players    []string   `json:"players"`
	Turn       int        `json:"turn"`
	Board      any        `json:"board"`
	Status     string     `json:"status"`
	Winner     string     `json:"winner"`
	ValidMoves []GameMove `json:"validMoves"`
}

type baseGame struct {
	self        Game
	mu          sync.RWMutex
	gameName    string
	players     []string
	turn        int
	numPlayers  int
	status      string
	disconnects map[string]time.Time
	notify      func(GameUpdate)

	winner  string
	endedAt time.Time

	ctx    context.Context
	cancel context.CancelFunc
}

func newBase(numPlayers int, gameName string, updator func(GameUpdate)) baseGame {
	ctx, cancel := context.WithCancel(context.Background())
	return baseGame{
		gameName:    gameName,
		players:     make([]string, 0, numPlayers),
		turn:        0,
		numPlayers:  numPlayers,
		status:      StatusWaiting,
		disconnects: make(map[string]time.Time),
		notify:      updator,
		ctx:         ctx,
		cancel:      cancel,
	}
}

func (b *baseGame) Start() {
	go b.ticker()
}

func (b *baseGame) Stop() {
	b.cancel()
}

func (b *baseGame) Join(player string) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	if len(b.players) >= b.numPlayers {
		return errors.New("game is full")
	}
	if slices.Contains(b.players, player) {
		return errors.New("already joined")
	}
	b.players = append(b.players, player)
	if len(b.players) == b.numPlayers {
		b.status = StatusInProgress
	}
	b.notify(GameUpdate{
		State:  b.stateLocked(),
		Action: UpdateAction,
	})
	return nil
}

func (b *baseGame) Rejoin(player string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if _, ok := b.disconnects[player]; ok {
		delete(b.disconnects, player)
		if len(b.disconnects) == 0 {
			b.status = StatusInProgress
		}
		b.notify(GameUpdate{
			State:  b.stateLocked(),
			Action: UpdateAction,
		})
	}
}

func (b *baseGame) Leave(player string, intentional bool) {
	b.mu.Lock()
	defer b.mu.Unlock()

	idx := slices.Index(b.players, player)
	if idx == -1 {
		return
	}
	if !intentional && (b.status == StatusInProgress || b.status == StatusDisconnected) {
		b.status = StatusDisconnected
		b.disconnects[player] = time.Now()
	} else {
		b.players = slices.Delete(b.players, idx, idx+1)
	}

	if len(b.players) == 0 {
		b.status = StatusFin
		b.endedAt = time.Now()
		b.notify(GameUpdate{
			State:  b.stateLocked(),
			Action: DeleteAction,
		})
		b.Stop()
		return
	}
	b.notify(GameUpdate{
		State:  b.stateLocked(),
		Action: UpdateAction,
	})
}

func (b *baseGame) checkTurnLocked(sender string) (int, error) {
	if b.status != StatusInProgress {
		return -1, errors.New("game not in progress")
	}
	idx := -1
	for i, p := range b.players {
		if p == sender {
			idx = i
			break
		}
	}
	if idx == -1 {
		return -1, errors.New("player not in game")
	}
	if idx != b.turn {
		return -1, errors.New("not your turn")
	}
	return idx, nil
}

func (b *baseGame) getValidMovesLocked() []GameMove {
	return nil
}

func (b *baseGame) GetState() *GameState {
	b.mu.RLock()
	defer b.mu.RUnlock()

	return b.stateLocked()
}

func (b *baseGame) stateLocked() *GameState {
	return &GameState{
		GameName:   b.gameName,
		Players:    b.players,
		Turn:       b.turn,
		Board:      b.self.getBoardLocked(),
		ValidMoves: b.self.getValidMovesLocked(),
		Status:     b.status,
		Winner:     b.winner,
	}
}

func (b *baseGame) ticker() {
	ticker := time.NewTicker(TickInterval)
	defer ticker.Stop()

	for {
		select {
		case <-b.ctx.Done():
			return
		case <-ticker.C:
			b.self.updateLoop()
		}
	}
}

func (b *baseGame) updateLoop() {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.status == StatusFin {
		if time.Since(b.endedAt) > CleanupDelay {
			b.notify(GameUpdate{
				State:  b.stateLocked(),
				Action: DeleteAction,
			})
			b.Stop()
		}
		return
	}

	// just stop game if player doesn't come back.
	disconnections := []string{}
	for player, disconnectTime := range b.disconnects {
		if time.Since(disconnectTime) > DisconnectTimeout {
			disconnections = append(disconnections, player)
		}
	}
	if len(disconnections) > 0 {
		for _, player := range disconnections {
			delete(b.disconnects, player)
			idx := slices.Index(b.players, player)
			if idx != -1 {
				b.players = slices.Delete(b.players, idx, idx+1)
			}
		}
		b.self.handleDisconnects()
	}
}

func (b *baseGame) handleDisconnects() {
	b.status = StatusFin
	b.endedAt = time.Now()
	if len(b.players) == 0 {
		b.notify(GameUpdate{
			State:  b.stateLocked(),
			Action: DeleteAction,
		})
		b.Stop()
	} else {
		b.notify(GameUpdate{
			State:  b.stateLocked(),
			Action: UpdateAction,
		})
	}
}
