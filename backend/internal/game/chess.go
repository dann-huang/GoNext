package game

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/corentings/chess/v2"
)

type chessGame struct {
	baseGame
	game *chess.Game
}

func newChess() Factory {
	return func(creator string, payload json.RawMessage) (Game, error) {
		game := &chessGame{
			baseGame: newBase(2, "chess"),
			game:     chess.NewGame(),
		}
		game.Players = []string{creator}
		game.Turn = 0
		return game, nil
	}
}

func rowCol2Move(x, y int) string {
	return fmt.Sprintf("%c%d", 'a'+x, 8-y)
}

func (g *chessGame) Move(sender string, payload json.RawMessage) (*GameState, error) {
	mv, _, err := g.validateMove(sender, payload)
	if err != nil {
		return nil, err
	}

	moveStr := rowCol2Move(mv.From.Row, mv.From.Col) + rowCol2Move(mv.To.Row, mv.To.Col)
	if mv.Change != "" {
		moveStr += mv.Change
	}
	notation := chess.UCINotation{}
	move, err := notation.Decode(g.game.Position(), moveStr)
	if err != nil {
		return nil, fmt.Errorf("invalid move format %q: %w", moveStr, err)
	}

	if err := g.game.Move(move, nil); err != nil {
		return nil, fmt.Errorf("illegal move %q: %w", moveStr, err)
	}

	if g.game.Outcome() != chess.NoOutcome {
		g.Status = StatusFin
		g.EndedAt = time.Now()
		switch g.game.Outcome() {
		case chess.WhiteWon:
			g.Winner = g.Players[0]
		case chess.BlackWon:
			g.Winner = g.Players[1]
		}
	}

	g.Turn = 1 - g.Turn

	return g.State(), nil
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

func (g *chessGame) State() *GameState {
	board := make([][]int, 8)
	for i := 0; i < 8; i++ {
		board[i] = make([]int, 8)
		for j := 0; j < 8; j++ {
			sq := chess.Square((7-i)*8 + j)
			piece := g.game.Position().Board().Piece(sq)
			if piece != chess.NoPiece {
				board[i][j] = pieceToCode(piece)
			} else {
				board[i][j] = 0
			}
		}
	}

	state := g.state(board)
	return state
}

func (g *chessGame) Tick() (*GameState, string) {
	if g.handleTimeout() {
		return g.State(), TickBroadcast
	}

	if g.Status == StatusFin && time.Since(g.EndedAt) > CleanupDelay {
		return nil, TickFinished
	}

	return nil, TickNoChange
}
