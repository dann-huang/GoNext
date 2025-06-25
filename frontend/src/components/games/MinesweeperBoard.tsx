'use client';

import { useGameBoard } from '@/hooks/useGameBoard';
import { GameStatus } from '@/hooks/useMinesweeper';
import { cn } from '@/lib/utils';
import { Bomb, Flag } from 'lucide-react';

type MineBoardProp = {
  gameState: GameStatus;
  reveal: (row: number, col: number) => void;
  flag: (row: number, col: number) => void;
}

export function MinesweeperBoard({ gameState, reveal, flag }: MineBoardProp) {
  const cols = gameState.board[0].length;
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
  return <div className='grid bg-surface p-2 gap-1 rounded-b-lg w-fit'
    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 60px))` }}>
    {gameState.board.map((cellRow, row) =>
      cellRow.map((cell, col) => <div
        key={`${row}-${col}`}
        className={cn('aspect-square flex items-center justify-center bg-primary text-on-primary rounded-md',
          cell.state === 'revealed' && 'bg-secondary text-on-secondary',
          cell.state === 'revealed' && cell.hasMine && 'bg-error text-on-error',
          hoveredCell === row * cols + col && 'bg-accent/50 text-on-accent',
        )}
        {...getCellProps(row * cols + col)}
      >
        {cell.state === 'flagged' && <Flag />}
        {cell.state === 'revealed' && (cell.hasMine ? <Bomb />
          : cell.adj > 0 ? <p>{cell.adj}</p> : null)}

      </div>)
    )}
  </div>;
}
