'use client';

import { MinesweeperBoard } from '@/components/games/MinesweeperBoard';
import { MineToolbar } from '@/components/games/MinesweeperToolbar';
import { InfoCard } from '@/components/UI/InfoCard';
import useMinesweeper from '@/hooks/useMinesweeper';
import { useState } from 'react';

export default function MinesweeperPage() {
  const [diff, setDiff] = useState({
    rows: 9,
    cols: 9,
    mines: 10,
  });
  const { gameState, reveal, flag, reset } = useMinesweeper(diff);

  const remainingMines = diff.mines - gameState.flagged;

  return <div className="w-full flex flex-col h-screen">
    <header className='w-full border-b border-border p-4'>
      <div className='flex items-center gap-2'>
        <h1 className='text-xl font-semibold'>Minesweeper</h1>
        <InfoCard width={250}>
          <p className='text-primary'>Normal Minesweeper rules</p>
          <p className='text-sm'>• Left click to reveal cells</p>
          <p className='text-sm'>• Right click to place flags</p>
          <p className='text-sm'>• Reveal all non-mine cells to win</p>
        </InfoCard>
      </div>
    </header>

    <div className="flex-1 flex flex-col items-center justify-center">
      <div className='touch-none select-none'>
        <MineToolbar
          gameState={gameState}
          remainingMines={remainingMines}
          reset={reset}
          setDiff={setDiff}
        />
        <MinesweeperBoard gameState={gameState} reveal={reveal} flag={flag} />
      </div>
    </div>
  </div>;
}
