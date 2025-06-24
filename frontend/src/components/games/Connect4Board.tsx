import { useState } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import { useUserStore } from '@/hooks/useUserStore';
import { cn } from '@/lib/utils';
import { useGameBoard } from '@/hooks/useGameBoard';

export function Connect4Board({ gameState, makeMove }: GameBoardProps) {
  const username = useUserStore(state => state.username);
  const yourIdx = gameState.players.indexOf(username);
  const isYourTurn = gameState.status == 'in_progress'
    && gameState.turn === yourIdx;

  const handleCellClick = (col: number) => {
    console.log(col);
    if (!isYourTurn) return;
    makeMove({ to: { row: 0, col } });
  };

  const { getCellProps, hoveredCell } = useGameBoard({
    onCellClick: handleCellClick,
  });

  return <div className='w-full bg-primary p-2 rounded-lg grid grid-cols-7 gap-2'
  >
    {[...Array(7)].map((_, col) => (
      <div
        key={`col-wrapper-${col}`}
        className='relative'
        {...getCellProps(col)}
      >
        {hoveredCell === col && (
          <div
            className='absolute top-0 -bottom-2 transition-all duration-200'
            style={{
              left: 0,
              width: '100%',
              background: `linear-gradient(to top, var(--color-${isYourTurn ? 'secondary' : 'background'}) 0%, transparent 100%)`,
              opacity: 0.7,
              borderRadius: '0.5rem',
            }}
          />
        )}
        {gameState.board.map((cellRow, row) => (
          <div
            key={`${row}-${col}`}
            className='aspect-square rounded-full p-1'
          >
            <div className={cn('w-full h-full rounded-full',
              cellRow[col] ?
                yourIdx >= 0 ? cellRow[col] === yourIdx + 1 ? 'bg-secondary' : 'bg-accent'
                  : cellRow[col] === 1 ? 'bg-secondary' : 'bg-accent'
                : 'bg-background'
            )} />
          </div>
        ))}
      </div>
    ))}
  </div>;
}
