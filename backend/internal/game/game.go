package game

import "encoding/json"

type Game interface {
	Create(sender string, payload json.RawMessage) error
	Join(sender string) error
	Move(sender string, payload json.RawMessage) (*GameState, error)
	State() *GameState
	IsFull() bool
	Leave(player string) bool
}

type GameState struct {
	Players []string    `json:"players"`
	Turn    string      `json:"turn"`
	Board   interface{} `json:"board"`
}
