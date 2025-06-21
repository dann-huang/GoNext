package game

import (
	"encoding/json"
	"fmt"
	"slices"
	"time"
)

const (
	StatusWaiting      = "waiting"
	StatusInProgress   = "in_progress"
	StatusFin          = "finished"
	StatusDisconnected = "disconnected"

	TickFinished  = "finished"
	TickNoChange  = "no_change"
	TickBroadcast = "broadcast"

	DisconnectTimeout = 30 * time.Second
	CleanupDelay      = 10 * time.Second
)

type Game interface {
	Join(sender string) error
	Move(sender string, payload json.RawMessage) (*GameState, error)
	State() *GameState
	Leave(player string, intentional bool) bool
	Tick() (*GameState, string)
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

type Position struct {
	Row int `json:"row"`
	Col int `json:"col"`
}

type GameMove struct {
	From   Position `json:"from"`
	To     Position `json:"to"`
	Change string   `json:"change,omitempty"`
}

type baseGame struct {
	GameName    string
	Players     []string
	Turn        int
	NumPlayers  int
	Status      string
	Winner      string
	Disconnects map[string]time.Time
	EndedAt     time.Time
}

func newBase(numPlayers int, gameName string) baseGame {
	return baseGame{
		GameName:    gameName,
		Players:     make([]string, 0, numPlayers),
		Turn:        0,
		NumPlayers:  numPlayers,
		Status:      StatusWaiting,
		Disconnects: make(map[string]time.Time),
	}
}

func (g *baseGame) Join(player string) error {
	if g.Status == StatusDisconnected {
		if _, ok := g.Disconnects[player]; ok {
			delete(g.Disconnects, player)
			if len(g.Disconnects) == 0 {
				g.Status = StatusInProgress
			}
			return nil
		}
		return fmt.Errorf("game is paused, waiting for player(s) to reconnect")
	}

	if len(g.Players) >= g.NumPlayers {
		return fmt.Errorf("game is full")
	}
	if slices.Contains(g.Players, player) {
		return fmt.Errorf("player already joined")
	}

	g.Players = append(g.Players, player)
	if len(g.Players) == g.NumPlayers {
		g.Status = StatusInProgress
	}
	return nil
}

func (g *baseGame) Leave(player string, intentional bool) bool {
	idx := slices.Index(g.Players, player)
	if idx == -1 {
		return false
	}

	if !intentional && (g.Status == StatusInProgress || g.Status == StatusDisconnected) {
		g.Status = StatusDisconnected
		g.Disconnects[player] = time.Now()
		return false
	}

	g.Players = slices.Delete(g.Players, idx, idx+1)
	return len(g.Players) == 0
}

func (g *baseGame) handleTimeout() bool {
	if g.Status == StatusDisconnected {
		var timedOutPlayer string
		for player, disconnectedAt := range g.Disconnects {
			if time.Since(disconnectedAt) > DisconnectTimeout {
				timedOutPlayer = player
				break
			}
		}
		if timedOutPlayer != "" {
			g.Status = StatusFin
			if len(g.Players) == 2 {
				winnerIdx := 1 - slices.Index(g.Players, timedOutPlayer)
				if winnerIdx >= 0 && winnerIdx < len(g.Players) {
					g.Winner = g.Players[winnerIdx]
				}
			}
			g.EndedAt = time.Now()
			return true
		}
	}

	if (g.Status == StatusFin) && g.EndedAt.IsZero() {
		g.EndedAt = time.Now()
	}
	return false
}

func (g *baseGame) validateMove(sender string, payload json.RawMessage) (*GameMove, int, error) {
	if g.Status != StatusInProgress {
		return nil, -1, fmt.Errorf("game not in progress")
	}
	var mv GameMove
	if err := json.Unmarshal(payload, &mv); err != nil {
		return nil, -1, fmt.Errorf("invalid move payload: %w", err)
	}
	idx := -1
	for i, p := range g.Players {
		if p == sender {
			idx = i
			break
		}
	}
	if idx == -1 {
		return nil, -1, fmt.Errorf("player not in game")
	}
	if idx != g.Turn {
		return nil, -1, fmt.Errorf("not your turn")
	}
	return &mv, idx, nil
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
