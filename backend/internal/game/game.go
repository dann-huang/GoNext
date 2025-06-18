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
	StatusWin          = "win"
	StatusDraw         = "draw"
	StatusDisconnected = "disconnected"

	DisconnectTimeout = 60 * time.Second
)

type Game interface {
	Join(sender string) error
	Move(sender string, payload json.RawMessage) (*GameState, error)
	State() *GameState
	Leave(player string) bool
	Tick() (*GameState, bool) // Tick handles time-based events, returns true if state changed
}

type GameState struct {
	GameName string   `json:"gameName"`
	Players  []string `json:"players"`
	Turn     string   `json:"turn"`
	Board    any      `json:"board"`
	Status   string   `json:"status"`
	Winner   string   `json:"winner,omitempty"`
}

type Position struct {
	Row int `json:"row"`
	Col int `json:"col"`
}

type GameMovePayload struct {
	From Position `json:"from"`
	To   Position `json:"to"`
}

type baseGame struct {
	GameName    string
	Players     []string
	Turn        int
	NumPlayers  int
	Status      string
	Winner      string
	Disconnects map[string]time.Time
}

func newBase(numPlayers int, gameName string) baseGame {
	return baseGame{
		GameName:    gameName,
		Players:     make([]string, 0, numPlayers),
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
				g.Status = StatusInProgress // Resume the game
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

func (g *baseGame) Leave(player string) bool {
	// If game is already over, leaving doesn't change the outcome
	if g.Status == StatusWin || g.Status == StatusDraw {
		return false
	}

	idx := slices.Index(g.Players, player)
	if idx == -1 {
		return len(g.Players) == 0
	}

	if g.Status == StatusInProgress || g.Status == StatusDisconnected {
		g.Status = StatusDisconnected
		g.Disconnects[player] = time.Now()
		return false
	}

	g.Players = slices.Delete(g.Players, idx, idx+1)
	if len(g.Players) < g.NumPlayers {
		g.Status = StatusWaiting
	}

	return len(g.Players) == 0
}

func (g *baseGame) handleTimeout() bool {
	if g.Status != StatusDisconnected {
		return false
	}

	var timedOutPlayer string
	for player, disconnectedAt := range g.Disconnects {
		if time.Since(disconnectedAt) > DisconnectTimeout {
			timedOutPlayer = player
			break
		}
	}
	if timedOutPlayer != "" {
		g.Status = StatusWin
		if len(g.Players) == 2 {
			winnerIdx := 1 - slices.Index(g.Players, timedOutPlayer)
			if winnerIdx >= 0 && winnerIdx < len(g.Players) {
				g.Winner = g.Players[winnerIdx]
			}
		}
		return true
	}

	return false
}

func (g *baseGame) validateMove(sender string, payload json.RawMessage) (*GameMovePayload, int, error) {
	if g.Status != StatusInProgress {
		return nil, -1, fmt.Errorf("game not in progress")
	}
	var mv GameMovePayload
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
	turn := ""
	if g.Status == StatusInProgress && len(g.Players) > g.Turn {
		turn = g.Players[g.Turn]
	}
	return &GameState{
		GameName: g.GameName,
		Players:  g.Players,
		Turn:     turn,
		Board:    board,
		Status:   g.Status,
		Winner:   g.Winner,
	}
}
