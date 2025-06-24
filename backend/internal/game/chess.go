package game

import (
	"errors"
	"log/slog"
	"time"

	"github.com/corentings/chess/v2"
)

type chessGame struct {
	baseGame
	GameName string
	game     *chess.Game
}

func newChess() Factory {
	return func(updator func(GameUpdate)) (Game, error) {
		game := &chessGame{
			baseGame: newBase(2, "chess", updator),
			game:     chess.NewGame(),
		}
		game.self = game
		return game, nil
	}
}

func (c *chessGame) getBoardLocked() any {
	board := make([][]int, 8)
	for i := range 8 {
		board[i] = make([]int, 8)
		for j := range 8 {
			sq := chess.Square((7-i)*8 + j)
			piece := c.game.Position().Board().Piece(sq)
			if piece != chess.NoPiece {
				board[i][j] = pieceToCode(piece)
			} else {
				board[i][j] = 0
			}
		}
	}
	return board
}

func (c *chessGame) getValidMovesLocked() []GameMove {
	validMoves := []GameMove{}
	if c.status == StatusInProgress {
		for _, mv := range c.game.ValidMoves() {
			from := mv.S1()
			to := mv.S2()
			validMoves = append(validMoves, GameMove{
				From: Position{
					Row: 7 - int(from.Rank()),
					Col: int(from.File()),
				},
				To: Position{
					Row: 7 - int(to.Rank()),
					Col: int(to.File()),
				},
			})
		}
	}
	return validMoves
}

func (c *chessGame) Move(sender string, mv *GameMove) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	_, err := c.checkTurnLocked(sender)
	if err != nil {
		return err
	}

	from := chess.Square((7-mv.From.Row)*8 + mv.From.Col)
	to := chess.Square((7-mv.To.Row)*8 + mv.To.Col)
	promo := change2Piece(mv.Change)

	var move *chess.Move
	for _, m := range c.game.ValidMoves() {
		if m.S1() == from && m.S2() == to && m.Promo() == promo {
			move = &m
			break
		}
	}
	if move == nil {
		return errors.New("invalid move: not legal in this position")
	}

	if err := c.game.Move(move, nil); err != nil {
		slog.Error("Internal error", "error", err)
		return errors.New("internal error")
	}

	if c.game.Outcome() != chess.NoOutcome {
		c.status = StatusFin
		c.endedAt = time.Now()
		switch c.game.Outcome() {
		case chess.WhiteWon:
			c.status = StatusFin
			c.winner = c.players[0]
		case chess.BlackWon:
			c.status = StatusFin
			c.winner = c.players[1]
		case chess.Draw:
			c.status = StatusFin
		}
	}
	c.turn = 1 - c.turn
	c.notify(GameUpdate{
		State:  c.stateLocked(),
		Action: UpdateAction,
	})
	return nil
}

func change2Piece(change string) chess.PieceType {
	switch change {
	case "q", "Q":
		return chess.Queen
	case "r", "R":
		return chess.Rook
	case "b", "B":
		return chess.Bishop
	case "n", "N":
		return chess.Knight
	}
	return chess.NoPieceType
}

func pieceToCode(piece chess.Piece) int {
	var code int
	switch piece.Type() {
	case chess.King:
		code += 1
	case chess.Queen:
		code += 2
	case chess.Rook:
		code += 3
	case chess.Bishop:
		code += 4
	case chess.Knight:
		code += 5
	case chess.Pawn:
		code += 6
	}
	if piece.Color() == chess.White {
		code += 10
	}
	return code
}
