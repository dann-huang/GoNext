import { useMemo } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import useUserStore from '@/hooks/useUserStore';
import { cn } from '@/lib/utils';
import { numToPiece } from './pieceMapping';
import { useGameBoard } from '@/hooks/useGameBoard';
import usePointerPos from '@/hooks/usePointerPos';

export default function ChessBoard({ gameState, makeMove }: GameBoardProps) {
  const username = useUserStore(state => state.username);
  const idx = gameState.players.indexOf(username);
  const yourTurn = gameState.status === 'in_progress' && gameState.turn === idx;
  const pointerPos = usePointerPos();
  const { getCellProps, hoveredCell, dragging, hangingPos } = useGameBoard({
    onCellDrop: (from, to) => {
      if (!yourTurn) return;
      const fromRow = Math.floor(from / 8);
      const fromCol = from % 8;
      const toRow = Math.floor(to / 8);
      const toCol = to % 8;

      if (gameState.validMoves.some(mv =>
        mv.from?.row === fromRow && mv.from?.col === fromCol &&
        mv.to.row === toRow && mv.to.col === toCol))
        makeMove({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } });
    }
  });

  const validSquares = useMemo(() => gameState.validMoves.filter(vMove => {
    if (dragging === null) return false;
    const row = Math.floor(dragging / 8);
    const col = dragging % 8;
    return vMove.from?.row === row && vMove.from?.col === col;
  }), [gameState.validMoves, dragging]);

  return <div className="w-full grid grid-cols-8 border-3 border-secondary">
    {gameState.board.map((cellRow, row) =>
      cellRow.map((cell, col) => {
        const isLight = (row + col) % 2 === 0;
        const Piece = numToPiece[cell];

        return <div
          key={`${row}-${col}`}
          className={cn(
            'aspect-square flex items-center justify-center relative transition-colors',
            validSquares.some(move => move.to.row === row && move.to.col === col)
              ? isLight ? 'bg-primary/33' : 'bg-primary/66'
              : isLight ? 'bg-secondary/10' : 'bg-secondary/50',
            hoveredCell === row * 8 + col && 'bg-accent/30',
            dragging === row * 8 + col && 'bg-accent/60'
          )}
          {...getCellProps(row * 8 + col)}
        >
          {Piece
            && !(dragging === row * 8 + col)
            && <Piece />}
        </div>
      })
    )}
    {dragging !== null && (() => {
      const row = Math.floor(dragging / 8);
      const col = dragging % 8;
      const pieceNum = gameState.board[row][col];
      const Piece = numToPiece[pieceNum];
      if (!Piece) return null;
      return <Piece className='fixed pointer-events-none z-50 
        transform -translate-x-1/2 -translate-y-1/2'
        style={{
          left: hangingPos?.x ?? pointerPos.x,
          top: hangingPos?.y ?? pointerPos.y,
        }} />;
    })()}
  </div>;
}
