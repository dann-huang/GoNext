'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import { useUserStore } from '@/hooks/userStore';
import { cn } from '@/lib/utils';
import { numToPiece, numToString } from './pieceMapping';
import { GameMove } from '@/types/wsTypes';
import { Rowdies } from 'next/font/google';

type Position = { row: number; col: number };

interface DragState {
  piece: number;
  from: Position;
  pos: { x: number; y: number };
}

export function ChessBoard({ gameState, makeMove }: GameBoardProps) {
  const username = useUserStore(state => state.username);
  const hover = useRef<Position | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const idx = gameState.players.indexOf(username);
  const yourTurn = gameState.status === 'in_progress' && gameState.turn === idx;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, piece: number, row: number, col: number) => {
    setDrag({
      piece: piece,
      from: { row, col },
      pos: { x: e.clientX, y: e.clientY },
    });
    e.preventDefault();
  };


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setDrag(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pos: { x: e.clientX, y: e.clientY },
        };
      });
    };

    const handleMouseUp = (e: MouseEvent) => setDrag(drag => {
      if (!drag || !hover.current) return null;
      makeMove({
        from: drag.from,
        to: hover.current,
      });
      return null;
    });

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setDrag]);

  const validSquares = useMemo(() => gameState.validMoves.filter(vMove =>
    vMove.from?.row === drag?.from.row && vMove.from?.col === drag?.from.col)
    , [gameState.validMoves, drag?.from.row, drag?.from.col]);

  return <div className="w-full grid grid-cols-8 border-3 border-secondary">
    {gameState.board.map((cellRow, row) =>
      cellRow.map((cell, col) => {
        const isLight = (row + col) % 2 === 0;
        const Piece = numToPiece[cell];

        return <div
          key={`${row}-${col}`}
          className={cn(
            'aspect-square flex items-center justify-center relative',
            'cursor-pointer transition-colors',
            'hover:bg-accent/30 group',
            validSquares.some(move => move.to.row === row && move.to.col === col)
              ? isLight ? 'bg-primary/33' : 'bg-primary/66'
              : isLight ? 'bg-secondary/33' : 'bg-secondary/66',
          )}
          onMouseEnter={() => hover.current = { row, col }}
          onMouseLeave={() => hover.current = null}
          onMouseDown={(e) => handleMouseDown(e, cell, row, col)}
        >
          {Piece
            && !(drag && drag.from.row === row && drag.from.col === col)
            && <Piece stroke='green' />}
        </div>
      })
    )}
  </div>;
}
