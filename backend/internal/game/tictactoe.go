package game

import (
	"fmt"
	"time"
)

type ticTacToe struct {
	baseGame
	board [3][3]int
}

func newTicTacToe() Factory {
	return func(updator func(GameUpdate)) (Game, error) {
		game := &ticTacToe{
			baseGame: newBase(2, "tictactoe", updator),
			board:    [3][3]int{},
		}
		game.self = game
		return game, nil
	}
}

func (t *ticTacToe) getBoardLocked() any {
	return t.board
}

func (t *ticTacToe) Move(sender string, mv *GameMove) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	idx, err := t.checkTurnLocked(sender)
	if err != nil {
		return err
	}

	if mv.To.Row < 0 || mv.To.Row > 2 || mv.To.Col < 0 || mv.To.Col > 2 {
		return fmt.Errorf("invalid move")
	}
	if t.board[mv.To.Row][mv.To.Col] != 0 {
		return fmt.Errorf("cell already taken")
	}
	t.board[mv.To.Row][mv.To.Col] = idx + 1

	if win := t.checkWin(); win != 0 {
		t.status = StatusFin
		t.winner = t.players[win-1]
		t.endedAt = time.Now()
	} else if t.checkDraw() {
		t.status = StatusFin
		t.endedAt = time.Now()
	}

	t.turn = 1 - t.turn
	t.notify(GameUpdate{
		State:  t.stateLocked(),
		Action: UpdateAction,
	})
	return nil
}

func (t *ticTacToe) checkWin() int {
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

func (t *ticTacToe) checkDraw() bool {
	for row := range 3 {
		for col := range 3 {
			if t.board[row][col] == 0 {
				return false
			}
		}
	}
	return true
}
