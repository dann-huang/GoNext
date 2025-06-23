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

	State() *GameState
	getBoard() any
	getValidMoves() []GameMove
	updateLoop()
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
	GameName    string
	Players     []string
	Turn        int
	NumPlayers  int
	Status      string
	Disconnects map[string]time.Time
	notify      func(GameUpdate)

	Winner  string
	EndedAt time.Time

	ctx    context.Context
	cancel context.CancelFunc
}

func newBase(numPlayers int, gameName string, updator func(GameUpdate)) baseGame {
	ctx, cancel := context.WithCancel(context.Background())
	return baseGame{
		GameName:    gameName,
		Players:     make([]string, 0, numPlayers),
		Turn:        0,
		NumPlayers:  numPlayers,
		Status:      StatusWaiting,
		Disconnects: make(map[string]time.Time),
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
	if len(b.Players) >= b.NumPlayers {
		return errors.New("game is full")
	}
	if slices.Contains(b.Players, player) {
		return errors.New("already joined")
	}
	b.Players = append(b.Players, player)
	if len(b.Players) == b.NumPlayers {
		b.Status = StatusInProgress
	}
	b.notify(GameUpdate{
		State:  b.State(),
		Action: UpdateAction,
	})
	return nil
}

func (b *baseGame) Rejoin(player string) {
	if _, ok := b.Disconnects[player]; ok {
		delete(b.Disconnects, player)
		if len(b.Disconnects) == 0 {
			b.Status = StatusInProgress
		}
		b.notify(GameUpdate{
			State:  b.State(),
			Action: UpdateAction,
		})
	}
}

func (b *baseGame) Leave(player string, intentional bool) {
	idx := slices.Index(b.Players, player)
	if idx == -1 {
		return
	}
	if !intentional && (b.Status == StatusInProgress || b.Status == StatusDisconnected) {
		b.Status = StatusDisconnected
		b.Disconnects[player] = time.Now()
	}
	b.Players = slices.Delete(b.Players, idx, idx+1)
	if len(b.Players) == 0 {
		b.notify(GameUpdate{
			State:  b.State(),
			Action: DeleteAction,
		})
		return
	}
	b.notify(GameUpdate{
		State:  b.State(),
		Action: UpdateAction,
	})
}

func (b *baseGame) checkTurn(sender string) (int, error) {
	if b.Status != StatusInProgress {
		return -1, errors.New("game not in progress")
	}
	idx := -1
	for i, p := range b.Players {
		if p == sender {
			idx = i
			break
		}
	}
	if idx == -1 {
		return -1, errors.New("player not in game")
	}
	if idx != b.Turn {
		return -1, errors.New("not your turn")
	}
	return idx, nil
}

func (b *baseGame) getValidMoves() []GameMove {
	return nil
}

func (b *baseGame) State() *GameState {
	return &GameState{
		GameName:   b.GameName,
		Players:    b.Players,
		Turn:       b.Turn,
		Board:      b.self.getBoard(),
		ValidMoves: b.self.getValidMoves(),
		Status:     b.Status,
		Winner:     b.Winner,
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
	// just stop game if player doesn't come back.
	for _, disconnectTime := range b.Disconnects {
		if time.Since(disconnectTime) > DisconnectTimeout {
			b.notify(GameUpdate{
				State:  b.State(),
				Action: DeleteAction,
			})
		}
	}

	if time.Since(b.EndedAt) > CleanupDelay {
		b.notify(GameUpdate{
			State:  b.State(),
			Action: DeleteAction,
		})
	}
}
