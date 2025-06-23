package game

import (
	"fmt"
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
}

func newBase(numPlayers int, gameName string, updator func(GameUpdate)) baseGame {
	return baseGame{
		GameName:    gameName,
		Players:     make([]string, 0, numPlayers),
		Turn:        0,
		NumPlayers:  numPlayers,
		Status:      StatusWaiting,
		Disconnects: make(map[string]time.Time),
		notify:      updator,
	}
}

func (g *baseGame) join(player string) error {
	if len(g.Players) >= g.NumPlayers {
		return fmt.Errorf("game is full")
	}
	if slices.Contains(g.Players, player) {
		return fmt.Errorf("already joined")
	}
	g.Players = append(g.Players, player)
	if len(g.Players) == g.NumPlayers {
		g.Status = StatusInProgress
	}
	return nil
}

func (g *baseGame) rejoin(player string) bool {
	if _, ok := g.Disconnects[player]; ok {
		delete(g.Disconnects, player)
		if len(g.Disconnects) == 0 {
			g.Status = StatusInProgress
		}
		return true
	}
	return false
}

func (g *baseGame) leave(player string, intentional bool) bool {
	idx := slices.Index(g.Players, player)
	if idx == -1 {
		return false
	}
	if !intentional && (g.Status == StatusInProgress || g.Status == StatusDisconnected) {
		g.Status = StatusDisconnected
		g.Disconnects[player] = time.Now()
	}
	g.Players = slices.Delete(g.Players, idx, idx+1)
	if len(g.Players) == 0 {
		g.Status = StatusWaiting
	}
	return true
}

func (g *baseGame) validateMove(sender string, mv *GameMove) (int, error) {
	if g.Status != StatusInProgress {
		return -1, fmt.Errorf("game not in progress")
	}
	idx := -1
	for i, p := range g.Players {
		if p == sender {
			idx = i
			break
		}
	}
	if idx == -1 {
		return -1, fmt.Errorf("player not in game")
	}
	if idx != g.Turn {
		return -1, fmt.Errorf("not your turn")
	}
	return idx, nil
}

func (g *baseGame) state(board any) *GameState {
	return &GameState{
		GameName: g.GameName,
		Players:  g.Players,
		Turn:     g.Turn,
		Board:    board,
		Status:   g.Status,
		Winner:   g.Winner,
	}
}
