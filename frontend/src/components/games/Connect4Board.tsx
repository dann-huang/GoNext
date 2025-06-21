import { useState } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import { useUserStore } from '@/hooks/userStore';
import { cn } from '@/lib/utils';

export function Connect4Board({ gameState, makeMove }: GameBoardProps) {
  const [hoveredCol, setHoveredCol] = useState<number>(-1);
  const username = useUserStore(state => state.username);
  const yourIdx = gameState.players.indexOf(username);
  const isYourTurn = gameState.status == 'in_progress'
    && gameState.turn === yourIdx;

  const handleClick = () => {
    if (!isYourTurn || hoveredCol < 0) return;
    makeMove({ to: { row: 0, col: hoveredCol } });
  };

  return <div className='w-full bg-primary p-2 rounded-lg'
    onClick={handleClick}
    onMouseLeave={() => setHoveredCol(-1)}
  >
    <div className='grid grid-cols-7 gap-2 relative'>
      {hoveredCol >= 0 && (
        <div
          className='absolute top-0 -bottom-2 pointer-events-none transition-all duration-200'
          style={{
            left: `calc(${(hoveredCol * 100 / 7)}% + ${(hoveredCol * 8) / 7}px)`,
            width: `calc(${100 / 7}% - 8px)`,
            background: `linear-gradient(to top, var(--color-${isYourTurn ? 'secondary' : 'background'}) 0%, transparent 100%)`,
            opacity: 0.7,
            borderRadius: '0.5rem',
          }}
        />
      )}
      {gameState.board.map((cellRow, row) => (
        cellRow.map((cell, col) => (
          <div
            key={`${row}-${col}`}
            className='aspect-square rounded-full p-1'
            onMouseEnter={() => setHoveredCol(col)}
          >
            <div className={cn('w-full h-full rounded-full',
              cell ?
                yourIdx >= 0 ? cell === yourIdx + 1 ? 'bg-secondary' : 'bg-accent'
                  : cell === 1 ? 'bg-secondary' : 'bg-accent'
                : 'bg-background'
            )} />
          </div>
        ))
      ))}
    </div>
  </div>;
}
