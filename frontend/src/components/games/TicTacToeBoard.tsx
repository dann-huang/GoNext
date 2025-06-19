'use client';

import { useCallback } from 'react';
import { GameBoardProps } from '@/types/gameTypes';

const CELL_SYMBOLS = ['', 'X', 'O'] as const;
const CELL_COLORS = [
  'text-foreground',     // Empty
  'text-blue-500',      // X
  'text-red-500'       // O
] as const;

export function TicTacToeBoard({ gameState, onMove }: GameBoardProps) {
  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState.status === 'in_progress' && gameState.board[row][col] === 0) {
      onMove({ to: { row, col } });
    }
  }, [gameState.status, gameState.board, onMove]);

  return <div className="flex flex-col items-center space-y-4">
    <div className="grid grid-cols-3 gap-2 bg-foreground/10 p-2 rounded-lg">
      {gameState.board.map((row, rowIndex) => (
        row.map((cell, colIndex) => {
          const isCellEmpty = cell === 0;
          const symbol = CELL_SYMBOLS[cell] || '';
          const color = CELL_COLORS[cell] || 'text-foreground';
          const isClickable = isCellEmpty && gameState.status === 'in_progress';

          return <button
            key={`${rowIndex}-${colIndex}`}
            onClick={() => handleCellClick(rowIndex, colIndex)}
            disabled={!isClickable}
            className={`
                  w-20 h-20 flex items-center justify-center text-4xl font-bold
                  rounded-md transition-colors ${color}
                  ${isClickable
                ? 'cursor-pointer hover:bg-foreground/10'
                : 'cursor-not-allowed'}
                `}
            aria-label={`Cell ${rowIndex * 3 + colIndex + 1}${symbol ? `, ${symbol}` : ''}`}
          >
            {symbol}
          </button>;
        })
      ))}
    </div>
  </div>;
}
