package game

import (
	"fmt"
)

// Factory is a function that creates a new Game instance.
type Factory func() Game

// GameInfo holds metadata for a game: its factory and payload types.
type GameInfo struct {
	Factory      Factory
}

type Registry struct {
	games map[string]GameInfo
}

func NewRegistry() *Registry {
	return &Registry{games: make(map[string]GameInfo)}
}



func (r *Registry) Register(name string, factory Factory) {
	r.games[name] = GameInfo{
		Factory: factory,
	}
}

func (r *Registry) Create(name string) (Game, error) {
	info, ok := r.games[name]
	if !ok {
		return nil, fmt.Errorf("game type not supported: %s", name)
	}
	return info.Factory(), nil
}

func (r *Registry) List() map[string]GameInfo {
	result := make(map[string]GameInfo, len(r.games))
	for k, v := range r.games {
		result[k] = v
	}
	return result
}


