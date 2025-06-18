package game

import (
	"encoding/json"
	"fmt"
)

type Connect4 struct {
	baseGame
	board [6][7]int
}

func NewConnect4() Game {
	return &Connect4{
		baseGame: newBase(2, "connect4"),
	}
}

func (c *Connect4) Create(sender string, payload json.RawMessage) error {
	c.Players = []string{sender}
	c.Turn = 0
	c.board = [6][7]int{}
	return nil
}

func (c *Connect4) Move(sender string, payload json.RawMessage) (*GameState, error) {
	mv, idx, err := c.validateMove(sender, payload)
	if err != nil {
		return nil, err
	}

	if mv.To.Col < 0 || mv.To.Col > 6 {
		return nil, fmt.Errorf("invalid move")
	}

	// Find the first empty row in the column
	var droppedRow int = -1
	for row := 5; row >= 0; row-- {
		if c.board[row][mv.To.Col] == 0 {
			c.board[row][mv.To.Col] = idx + 1
			droppedRow = row
			break
		}
	}

	if droppedRow == -1 {
		return nil, fmt.Errorf("invalid move")
	}

	if win := c.checkWinner(droppedRow, mv.To.Col); win != 0 {
		c.Status = StatusWin
		c.Winner = c.Players[win-1]
	} else if c.checkDraw() {
		c.Status = StatusDraw
	}

	c.Turn = 1 - c.Turn
	return c.State(), nil
}

func (c *Connect4) State() *GameState {
	return c.state(c.board)
}

func (c *Connect4) checkWinner(startRow, startCol int) int {
	player := c.board[startRow][startCol]
	if player == 0 {
		return 0
	}

	directions := [][2]int{{0, 1}, {1, 0}, {1, 1}, {1, -1}}

	for _, dir := range directions {
		count := 1
		for i := 1; i < 4; i++ {
			row, col := startRow+dir[0]*i, startCol+dir[1]*i
			if row >= 0 && row < 6 && col >= 0 && col < 7 && c.board[row][col] == player {
				count++
			} else {
				break
			}
		}
		for i := 1; i < 4; i++ {
			row, col := startRow-dir[0]*i, startCol-dir[1]*i
			if row >= 0 && row < 6 && col >= 0 && col < 7 && c.board[row][col] == player {
				count++
			} else {
				break
			}
		}
		if count >= 4 {
			return player
		}
	}
	return 0
}

func (c *Connect4) checkDraw() bool {
	for col := range 7 {
		if c.board[0][col] == 0 {
			return false
		}
	}
	return true
}

func (c *Connect4) Tick() (*GameState, bool) {
	if c.handleTimeout() {
		return c.State(), true
	}
	return nil, false
}
