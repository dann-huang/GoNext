'use client';

import { useCallback } from 'react';
import { GameBoardProps } from '@/types/gameTypes';

const CELL_SYMBOLS = ['', 'X', 'O'] as const;
const CELL_COLORS = [
  'text-foreground/50', // Empty
  'text-blue-500',     // X
  'text-red-500'       // O
] as const;

export function TicTacToeBoard({ gameState, onMove }: GameBoardProps) {
  return (
    <div className="flex flex-col items-center space-y-4">

    </div>
  );
}
