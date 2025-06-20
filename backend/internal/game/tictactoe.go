package game

import (
	"encoding/json"
	"fmt"
	"time"
)

type TicTacToe struct {
	baseGame
	board [3][3]int
}

func NewTicTacToe() Factory {
	return func(creator string, payload json.RawMessage) (Game, error) {
		game := &TicTacToe{
			baseGame: newBase(2, "tictactoe"),
			board:    [3][3]int{},
		}
		game.Players = []string{creator}
		game.Turn = 0
		return game, nil
	}
}

func (t *TicTacToe) Move(sender string, payload json.RawMessage) (*GameState, error) {
	mv, idx, err := t.validateMove(sender, payload)
	if err != nil {
		return nil, err
	}

	if mv.To.Row < 0 || mv.To.Row > 2 || mv.To.Col < 0 || mv.To.Col > 2 {
		return nil, fmt.Errorf("invalid move")
	}
	if t.board[mv.To.Row][mv.To.Col] != 0 {
		return nil, fmt.Errorf("cell already taken")
	}
	t.board[mv.To.Row][mv.To.Col] = idx + 1

	if win := t.checkWin(); win != 0 {
		t.Status = StatusFin
		t.Winner = t.Players[win-1]
		t.EndedAt = time.Now()
	} else if t.checkDraw() {
		t.Status = StatusFin
		t.EndedAt = time.Now()
	}

	t.Turn = 1 - t.Turn
	return t.State(), nil
}

func (t *TicTacToe) State() *GameState {
	return t.state(t.board)
}

func (t *TicTacToe) checkWin() int {
	lines := [8][3][2]int{
		{{0, 0}, {0, 1}, {0, 2}},
		{{1, 0}, {1, 1}, {1, 2}},
		{{2, 0}, {2, 1}, {2, 2}},

		{{0, 0}, {1, 0}, {2, 0}},
		{{0, 1}, {1, 1}, {2, 1}},
		{{0, 2}, {1, 2}, {2, 2}},

		{{0, 0}, {1, 1}, {2, 2}},
		{{0, 2}, {1, 1}, {2, 0}},
	}
	for _, line := range lines {
		a, b, c := line[0], line[1], line[2]
		if t.board[a[0]][a[1]] != 0 &&
			t.board[a[0]][a[1]] == t.board[b[0]][b[1]] &&
			t.board[a[0]][a[1]] == t.board[c[0]][c[1]] {
			return t.board[a[0]][a[1]]
		}
	}
	return 0
}

func (t *TicTacToe) checkDraw() bool {
	for row := range 3 {
		for col := range 3 {
			if t.board[row][col] == 0 {
				return false
			}
		}
	}
	return true
}

func (t *TicTacToe) Tick() (*GameState, string) {
	if t.handleTimeout() {
		return t.State(), TickFinished
	}
	if !t.EndedAt.IsZero() && time.Since(t.EndedAt) > CleanupDelay {
		return t.State(), TickFinished
	}
	return nil, TickNoChange
}
