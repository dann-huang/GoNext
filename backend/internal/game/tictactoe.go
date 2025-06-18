package game

import (
	"encoding/json"
	"fmt"
)

type TicTacToe struct {
	players []string
	board   [3][3]int
	turn    int
	created bool
	winner  int
}

type TicTacToeMove struct {
	Row int `json:"row"`
	Col int `json:"col"`
}

func NewTicTacToe() Game {
	return &TicTacToe{}
}

func (t *TicTacToe) Create(sender string, payload json.RawMessage) error {
	if t.created {
		return fmt.Errorf("game already created")
	}
	t.players = []string{sender}
	t.turn = 0
	t.board = [3][3]int{}
	t.created = true
	t.winner = 0
	return nil
}

func (t *TicTacToe) Join(player string) error {
	if !t.created {
		return fmt.Errorf("game not created")
	}
	if len(t.players) >= 2 {
		return fmt.Errorf("game is full")
	}
	if t.players[0] == player {
		return fmt.Errorf("player already joined")
	}
	t.players = append(t.players, player)
	return nil
}

func (t *TicTacToe) Move(sender string, payload json.RawMessage) (*GameState, error) {
	if !t.created || len(t.players) < 2 {
		return nil, fmt.Errorf("game not ready")
	}
	if t.winner != 0 {
		return nil, fmt.Errorf("game is over")
	}
	var mv TicTacToeMove
	if err := json.Unmarshal(payload, &mv); err != nil {
		return nil, fmt.Errorf("invalid move payload: %w", err)
	}
	if mv.Row < 0 || mv.Row > 2 || mv.Col < 0 || mv.Col > 2 {
		return nil, fmt.Errorf("invalid move coordinates")
	}
	idx := -1
	for i, p := range t.players {
		if p == sender {
			idx = i
			break
		}
	}
	if idx != t.turn {
		return nil, fmt.Errorf("not your turn")
	}
	if t.board[mv.Row][mv.Col] != 0 {
		return nil, fmt.Errorf("cell already taken")
	}
	t.board[mv.Row][mv.Col] = idx + 1
	if win := t.checkWinner(); win != 0 {
		t.winner = win
	} else if t.isBoardFull() {
		t.winner = 3
	}
	t.turn = 1 - t.turn
	return t.State(), nil
}

func (t *TicTacToe) State() *GameState {
	turn := ""
	if len(t.players) > t.turn {
		turn = t.players[t.turn]
	}
	return &GameState{
		Players: t.players,
		Turn:    turn,
		Board:   t.board,
	}
}

func (t *TicTacToe) IsFull() bool {
	return len(t.players) == 2
}

func (t *TicTacToe) Leave(player string) bool {
	// Remove player from t.players
	idx := -1
	for i, p := range t.players {
		if p == player {
			idx = i
			break
		}
	}
	if idx != -1 {
		t.players = append(t.players[:idx], t.players[idx+1:]...)
	}
	if len(t.players) == 0 {
		t.created = false
		t.winner = 0
		t.turn = 0
		t.board = [3][3]int{}
		return true
	}
	return false
}


func (t *TicTacToe) checkWinner() int {
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

func (t *TicTacToe) isBoardFull() bool {
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if t.board[i][j] == 0 {
				return false
			}
		}
	}
	return true
}
