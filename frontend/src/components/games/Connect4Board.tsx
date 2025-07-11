import { GameBoardProps } from '@/types/gameTypes';
import useUserStore from '@/hooks/useUserStore';
import { cn } from '@/lib/utils';
import { useGameBoard } from '@/hooks/useGameBoard';

export default function Connect4Board({ gameState, makeMove }: GameBoardProps) {
  const username = useUserStore(state => state.username);
  const yourIdx = gameState.players.indexOf(username);
  const isYourTurn = gameState.status == 'in_progress'
    && gameState.turn === yourIdx;

  const { getCellProps, hoveredCell } = useGameBoard({
    onCellClick: (col: number) => {
      if (!isYourTurn) return;
      makeMove({ to: { row: 0, col } });
    },
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
            className='absolute top-0 -bottom-2 w-full duration-200 opacity-70'
            style={{
              background: `linear-gradient(to top, var(--color-
              ${isYourTurn ? 'secondary' : 'background'}) 0%, transparent 100%)`,
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
