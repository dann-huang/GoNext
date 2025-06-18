package game

import (
	"encoding/json"
	"fmt"
)

// Connect4 implements the Game interface for a 2-player Connect Four game.
type Connect4 struct {
	players []string  // usernames
	turn    int       // 0 or 1
	board   [6][7]int // 0=empty, 1=player1, 2=player2
	created bool
}

func NewConnect4() Game {
	return &Connect4{
		players: make([]string, 0, 2),
		turn:    0,
		board:   [6][7]int{},
		created: false,
	}
}

type Connect4CreateOptions struct {
	GameName string `json:"gameName"`
}

type Connect4Move struct {
	Col int `json:"col"`
}

func (c *Connect4) Create(sender string, payload json.RawMessage) error {
	if c.created {
		return fmt.Errorf("game already exists")
	}
	var opts Connect4CreateOptions
	if len(payload) > 0 {
		if err := json.Unmarshal(payload, &opts); err != nil {
			return fmt.Errorf("invalid create payload: %w", err)
		}
	}
	c.players = []string{sender}
	_ = opts // explicitly ignore unused variable for now
	c.players = []string{sender}
	c.turn = 0
	c.board = [6][7]int{}
	c.created = true
	return nil
}

func (c *Connect4) Join(player string) error {
	if !c.created {
		return fmt.Errorf("game not created")
	}
	if len(c.players) >= 2 {
		return fmt.Errorf("game is full")
	}
	if c.players[0] == player {
		return fmt.Errorf("player already joined")
	}
	c.players = append(c.players, player)
	return nil
}

func (c *Connect4) Move(sender string, payload json.RawMessage) (*GameState, error) {
	if !c.created || len(c.players) < 2 {
		return nil, fmt.Errorf("game not ready")
	}
	var mv Connect4Move
	if err := json.Unmarshal(payload, &mv); err != nil {
		return nil, fmt.Errorf("invalid move payload: %w", err)
	}
	idx := -1
	for i, p := range c.players {
		if p == sender {
			idx = i
			break
		}
	}
	if idx != c.turn {
		return nil, fmt.Errorf("not your turn")
	}
	if mv.Col < 0 || mv.Col > 6 {
		return nil, fmt.Errorf("invalid column")
	}
	// Drop the piece
	for row := 5; row >= 0; row-- {
		if c.board[row][mv.Col] == 0 {
			c.board[row][mv.Col] = idx + 1
			c.turn = 1 - c.turn
			return c.State(), nil
		}
	}
	if c.board[0][mv.Col] != 0 {
		return nil, fmt.Errorf("column full")
	}
	return nil, fmt.Errorf("unknown error")
}

func (c *Connect4) State() *GameState {
	return &GameState{
		Players: c.players,
		Turn:    c.players[c.turn],
		Board:   c.board,
	}
}

func (c *Connect4) IsFull() bool {
	return len(c.players) == 2
}

func (c *Connect4) Leave(player string) bool {
	idx := -1
	for i, p := range c.players {
		if p == player {
			idx = i
			break
		}
	}
	if idx != -1 {
		c.players = append(c.players[:idx], c.players[idx+1:]...)
	}
	if len(c.players) == 0 {
		c.created = false
		c.turn = 0
		c.board = [6][7]int{}
		return true
	}
	return false
}
