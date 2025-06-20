package game

import (
	"encoding/json"
	"fmt"
)

type Factory func(creator string, payload json.RawMessage) (Game, error)

// just in case we need payload for alternative modes
type GameInfo struct {
	Factory Factory
}

type Registry struct {
	games map[string]GameInfo
}

func NewRegistry() *Registry {
	return &Registry{games: make(map[string]GameInfo)}
}

func (r *Registry) register(name string, factory Factory) {
	r.games[name] = GameInfo{
		Factory: factory,
	}
}

func (r *Registry) RegisterAll() {
	r.register("tictactoe", newTicTacToe())
	r.register("connect4", newConnect4())
	r.register("chess", newChess())
}

func (r *Registry) Create(name, creator string, payload json.RawMessage) (Game, error) {
	info, ok := r.games[name]
	if !ok {
		return nil, fmt.Errorf("game type not supported: %s", name)
	}
	return info.Factory(creator, payload)
}
