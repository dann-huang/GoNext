'use client';

import { useCallback } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import { useUserStore } from '@/hooks/userStore';

const CELL_COLORS = [
  'bg-background',          // Empty
  'bg-red-500',            // Player 1
  'bg-yellow-500',         // Player 2
] as const;

export function Connect4Board({ gameState, onMove }: GameBoardProps) {
  const username = useUserStore(state => state.username);
  const isYourTurn = gameState.status == 'in_progress' && gameState.turn === username;

  const handleClick = useCallback((col: number) => {
    if (!isYourTurn) return;
    onMove({ to: { row: 0, col } });
  }, [gameState.board, gameState.turn, username, onMove, isYourTurn ]);

  return <div className="flex flex-col space-y-4">
    <div className="grid grid-cols-7 gap-2">
      {gameState.board[0].map((_, col) => (
        <button
          key={`header-${col}`}
          onClick={() => handleClick(col)}
          disabled={!isYourTurn}
          className="h-8 w-full bg-foreground/20 rounded-t-md flex items-center justify-center text-foreground/50 hover:bg-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Column ${col + 1}`}
        >
          ↓
        </button>
      ))}
    </div>

    <div className="bg-blue-600 p-2 rounded-lg">
      <div className="grid grid-cols-7 gap-2">
        {gameState.board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="aspect-square rounded-full p-1"
            >
              <div className={`w-full h-full rounded-full ${CELL_COLORS[cell] || 'bg-background'}`} />
            </div>
          ))
        ))}
      </div>
    </div>
  </div>;
}
