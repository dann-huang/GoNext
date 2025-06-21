'use client';

import { useCallback, useState } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import { useUserStore } from '@/hooks/userStore';
import { cn } from '@/lib/utils';
import { X, Circle } from 'lucide-react';

export function TicTacToeBoard({ gameState, makeMove }: GameBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number, col: number } | null>(null);
  const username = useUserStore(state => state.username);
  const yourIdx = gameState.players.indexOf(username);
  const isYourTurn = gameState.status === 'in_progress' && gameState.turn === yourIdx;

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState.status === 'in_progress' && gameState.board[row][col] === 0 && isYourTurn)
      makeMove({ to: { row, col } });
  }, [gameState.status, gameState.board, makeMove, isYourTurn]);

  return <div className='w-full bg-secondary p-4 rounded-lg grid grid-cols-3 gap-4'>
    {gameState.board.map((cellRow, row) =>
      cellRow.map((cell, col) => {
        const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;

        return <div key={`${row}-${col}`}
          className={cn(
            'aspect-square rounded-md flex items-center justify-center',
            'transition-all cursor-pointer bg-background shadow-sm relative',
            {
              'text-primary': cell === yourIdx + 1 || yourIdx === -1,
              'text-accent': cell > 0 && yourIdx !== -1 && cell !== yourIdx + 1,
            }
          )}
          onClick={() => handleCellClick(row, col)}
          onMouseEnter={() => setHoveredCell({ row, col })}
          onMouseLeave={() => setHoveredCell(null)}
        >
          {isHovered && <div className='absolute inset-0 bg-primary/10 rounded-md' />}
          {cell === 1 ? <X className='w-30 h-30 stroke-[4px]' />
            : cell === 2 ? <Circle className='w-23 h-23 stroke-[4px]' />
              : null}
        </div>;
      })
    )}
  </div>;
}
