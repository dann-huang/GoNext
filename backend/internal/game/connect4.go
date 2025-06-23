package game

import (
	"errors"
	"time"
)

type connect4 struct {
	baseGame
	GameName string
	board    [6][7]int
}

func newConnect4() Factory {
	return func(updator func(GameUpdate)) (Game, error) {
		return &connect4{
			baseGame: newBase(2, "connect4", updator),
			board:    [6][7]int{},
		}, nil
	}
}

func (c *connect4) getBoardLocked() any {
	return c.board
}

func (c *connect4) Move(sender string, mv *GameMove) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	idx, err := c.checkTurnLocked(sender)
	if err != nil {
		return err
	}

	if mv.To.Col < 0 || mv.To.Col > 6 {
		return errors.New("invalid move")
	}

	var droppedRow int = -1
	for row := 5; row >= 0; row-- {
		if c.board[row][mv.To.Col] == 0 {
			c.board[row][mv.To.Col] = idx + 1
			droppedRow = row
			break
		}
	}

	if droppedRow == -1 {
		return errors.New("invalid move")
	}

	if win := c.checkWinner(droppedRow, mv.To.Col); win != 0 {
		c.status = StatusFin
		c.winner = c.players[win-1]
		c.endedAt = time.Now()
	} else if c.checkDraw() {
		c.status = StatusFin
		c.endedAt = time.Now()
	}
	c.turn = 1 - c.turn
	c.notify(GameUpdate{
		State:  c.stateLocked(),
		Action: UpdateAction,
	})
	return nil
}

func (c *connect4) checkWinner(startRow, startCol int) int {
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

func (c *connect4) checkDraw() bool {
	for col := range 7 {
		if c.board[0][col] == 0 {
			return false
		}
	}
	return true
}
