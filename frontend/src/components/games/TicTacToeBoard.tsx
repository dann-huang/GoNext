'use client';

import { useCallback } from 'react';
import { GameMove } from '@/types/wsTypes';

interface TicTacToeBoardProps {
  board: number[][];
  currentPlayer: string;
  isYourTurn: boolean;
  onMove: (move: GameMove) => void;
}

const CELL_SYMBOLS = ['', 'X', 'O'] as const;
const CELL_COLORS = [
  'text-foreground/50', // Empty
  'text-blue-500',     // X
  'text-red-500'       // O
] as const;

export function TicTacToeBoard({ board, currentPlayer, isYourTurn, onMove }: TicTacToeBoardProps) {
  const handleCellClick = useCallback((row: number, col: number) => {
    if (board[row][col] === 0 && isYourTurn) {
      onMove({
        to: { row, col }
      });
    }
  }, [board, isYourTurn, onMove]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-lg font-medium">
        {isYourTurn ? `Your turn (${currentPlayer})` : `Waiting for opponent... (${currentPlayer}'s turn)`}
      </div>
      
      <div className="grid grid-cols-3 gap-2 bg-foreground p-2 rounded-lg">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isCellEmpty = cell === 0;
            const symbol = CELL_SYMBOLS[cell] || '';
            const color = CELL_COLORS[cell] || 'text-foreground';
            
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                disabled={!isYourTurn || !isCellEmpty}
                className={`
                  w-20 h-20 flex items-center justify-center text-3xl font-bold
                  rounded-md transition-colors
                  ${color}
                  bg-background
                  ${isYourTurn && isCellEmpty 
                    ? 'cursor-pointer hover:bg-secondary/70' 
                    : 'cursor-not-allowed'}
                `}
                aria-label={`Cell ${rowIndex * 3 + colIndex + 1}${symbol ? `, ${symbol}` : ''}`}
              >
                {symbol}
              </button>
            );
          })
        ))}
      </div>
    </div>
  );
}
