'use client';

import { useCallback } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import { useUserStore } from '@/hooks/useUserStore';
import { cn } from '@/lib/utils';
import { X, Circle } from 'lucide-react';
import { useGameBoard } from '@/hooks/useGameBoard';

export function TicTacToeBoard({ gameState, makeMove }: GameBoardProps) {
  const username = useUserStore(state => state.username);
  const yourIdx = gameState.players.indexOf(username);
  const isYourTurn = gameState.status === 'in_progress' && gameState.turn === yourIdx;

  const handleCellClick = useCallback((cell: number) => {
    const row = Math.floor(cell / 3);
    const col = cell % 3;
    if (gameState.status === 'in_progress' && gameState.board[row][col] === 0 && isYourTurn)
      makeMove({ to: { row, col } });
  }, [gameState.status, gameState.board, makeMove, isYourTurn]);

  const { getCellProps, hoveredCell } = useGameBoard({
    onCellClick: handleCellClick,
  });

  return <div className='w-full bg-secondary p-4 rounded-lg grid grid-cols-3 gap-4 touch-none'>
    {gameState.board.map((cellRow, row) =>
      cellRow.map((cell, col) => {
        const isHovered = row * 3 + col === hoveredCell;

        return <div key={`${row}-${col}`}
          className={cn(
            'aspect-square rounded-md flex items-center justify-center',
            'transition-all cursor-pointer bg-background shadow-sm relative',
            {
              'text-primary': cell === yourIdx + 1 || yourIdx === -1,
              'text-accent': cell > 0 && yourIdx !== -1 && cell !== yourIdx + 1,
            }
          )}
          {...getCellProps(row * 3 + col)}
        >
          {isHovered && <div className='absolute inset-0 bg-primary/10 rounded-md' />}
          {cell === 1 ? <X className='w-full h-full stroke-[3.5px]' />
            : cell === 2 ? <Circle className='w-full h-full p-3 stroke-[4px]' />
              : null}
        </div>;
      })
    )}
  </div>;
}
