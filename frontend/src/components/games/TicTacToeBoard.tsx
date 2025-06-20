'use client';

import { useCallback, useState } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import { useUserStore } from '@/hooks/userStore';
import { cn } from '@/lib/utils';
import { X, Circle } from 'lucide-react';

export function TicTacToeBoard({ gameState, onMove }: GameBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number, col: number } | null>(null);
  const username = useUserStore(state => state.username);
  const yourIdx = gameState.players.indexOf(username);
  const isYourTurn = gameState.status === 'in_progress' && gameState.turn === yourIdx;

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState.status === 'in_progress' && gameState.board[row][col] === 0 && isYourTurn) {
      onMove({ to: { row, col } });
    }
  }, [gameState.status, gameState.board, onMove, isYourTurn]);

  const handleCellHover = useCallback((row: number, col: number) => {
    if (gameState.status === 'in_progress' && gameState.board[row][col] === 0) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  }, [gameState.status, gameState.board]);

  return <div className="bg-secondary p-4 rounded-lg">
    <div className="grid grid-cols-3 gap-2 relative">
      {gameState.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isCellEmpty = cell === 0;
          const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                'aspect-square p-2 rounded-lg transition-all',
                'cursor-pointer',
                isCellEmpty && 'hover:bg-secondary/80 hover:scale-[1.03]',
                isHovered && 'bg-secondary/90 scale-[1.03]'
              )}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
              onMouseLeave={() => setHoveredCell(null)}
            >
              <div className={cn(
                'w-full h-full rounded-md flex items-center justify-center',
                'bg-background shadow-sm',
                {
                  'text-primary': cell === yourIdx + 1 || yourIdx === -1,
                  'text-accent': cell > 0 && yourIdx !== -1 && cell !== yourIdx + 1,
                  'opacity-90': isHovered,
                }
              )}>
                {cell === 1 ? (
                  <X className="w-16 h-16 stroke-[3px]" />
                ) : cell === 2 ? (
                  <Circle className="w-14 h-14 stroke-[3px]" />
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>;
}
