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
		return &ticTacToe{
			baseGame: newBase(2, "tictactoe", updator),
			board:    [3][3]int{},
		}, nil
	}
}

func (t *ticTacToe) state() *GameState {
	return t.baseGame.state(t.board)
}

func (t *ticTacToe) Join(player string) error {
	err := t.join(player)
	if err != nil {
		return err
	}
	t.notify(GameUpdate{
		State:  t.state(),
		Action: UpdateAction,
	})
	return nil
}

func (t *ticTacToe) Rejoin(player string) {
	t.rejoin(player)
	t.notify(GameUpdate{
		State:  t.state(),
		Action: UpdateAction,
	})
}

func (t *ticTacToe) Leave(player string, intentional bool) {
	success := t.leave(player, intentional)
	if success {
		t.notify(GameUpdate{
			State:  t.state(),
			Action: UpdateAction,
		})
	}
}

func (t *ticTacToe) Move(sender string, mv *GameMove) error {
	idx, err := t.validateMove(sender, mv)
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
		t.Status = StatusFin
		t.Winner = t.Players[win-1]
		t.EndedAt = time.Now()
	} else if t.checkDraw() {
		t.Status = StatusFin
		t.EndedAt = time.Now()
	}

	t.Turn = 1 - t.Turn
	t.notify(GameUpdate{
		State:  t.state(),
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
