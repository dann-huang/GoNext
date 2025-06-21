'use client';

import React, { useState, useCallback } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import { useUserStore } from '@/hooks/userStore';
import { cn } from '@/lib/utils';
import { numToPiece, numToString } from './pieceMapping';
import { GameMove } from '@/types/wsTypes';


type Position = { row: number; col: number };
export function ChessBoard({ gameState, onMove }: GameBoardProps) {
  const username = useUserStore(state => state.username);
  const idx = gameState.players.indexOf(username);
  const yourTurn = gameState.status === 'in_progress' && gameState.turn === idx;



  return <div className="grid grid-cols-8 border-2 border-accent/50">
    {gameState.board.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const isLight = (rowIndex + colIndex) % 2 === 0;
        const Piece = numToPiece[cell];

        return <div
          key={`${rowIndex}-${colIndex}`}
          className={cn(
            'aspect-square flex items-center justify-center relative',
            isLight ? 'bg-secondary/30' : 'bg-secondary/80',
            'cursor-pointer',
            'transition-colors duration-200',
            'hover:bg-opacity-80',
            'group'
          )}
        >
          {Piece && <Piece stroke='green' />}

        </div>
      })
    )}
  </div>;
}
