'use client';

import { useGameBoard } from '@/hooks/useGameBoard';
import useMinesweeper, { MineBoardProps } from '@/hooks/useMinesweeper';
import { cn } from '@/lib/utils';
import { Bomb, Flag } from 'lucide-react';

export function MinesweeperBoard({ rows, cols, mines }: MineBoardProps) {
  const { gameState, reveal, flag } = useMinesweeper({ rows, cols, mines });
  const { getCellProps, hoveredCell } = useGameBoard({
    onCellClick: (cell: number, clickType) => {
      const row = Math.floor(cell / cols);
      const col = cell % cols;
      if (clickType === 'right')
        flag(row, col);
      else
        reveal(row, col);
    },
  });
  return <div className={`w-full grid bg-secondary p-2 gap-2 rounded-md`}
    style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {gameState.board.map((cellRow, row) =>
      cellRow.map((cell, col) => <div
        key={`${row}-${col}`}
        className={cn('aspect-square flex items-center justify-center bg-primary rounded-md',
          cell.state === 'revealed' && 'bg-primary/33',
          cell.state === 'revealed' && cell.hasMine && 'bg-error',
          hoveredCell === row * cols + col && 'bg-accent/50',
        )}
        {...getCellProps(row * cols + col)}
      >
        {cell.state === 'flagged' && <Flag />}
        {cell.state === 'revealed' && cell.hasMine && <Bomb />}
        {cell.state === 'revealed' && cell.adj > 0 && <p className='text-primary'>{cell.adj}</p>}
      </div>)
    )}
  </div>;
}
