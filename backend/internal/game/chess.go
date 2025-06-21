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
func (g *chessGame) Move(sender string, payload json.RawMessage) (*GameState, error) {
	mv, _, err := g.validateMove(sender, payload)
	if err != nil {
		return nil, err
	}

	moveStr := rowCol2Move(mv.From) + rowCol2Move(mv.To)
	if mv.Change != "" {
		moveStr += mv.Change
	}
	notation := chess.UCINotation{}
	move, err := notation.Decode(g.game.Position(), moveStr)
	if err != nil {
		return nil, fmt.Errorf("invalid move format %q: %w", moveStr, err)
	}
	if g.game.Move(move, nil) != nil {
		return nil, fmt.Errorf("invalid move %q", moveStr)
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

func (g *chessGame) State() *GameState {
	board := make([][]int, 8)
	for i := range 8 {
		board[i] = make([]int, 8)
		for j := range 8 {
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
	state.ValidMoves = g.validMoves()
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

func (g *chessGame) validMoves() []GameMove {
	validMoves := []GameMove{}
	if g.Status != StatusInProgress {
		return validMoves
	}
	for _, mv := range g.game.ValidMoves() {
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
	return validMoves
}

func rowCol2Move(pos Position) string {
	return fmt.Sprintf("%c%d", 'a'+pos.Col, 8-pos.Row)
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
