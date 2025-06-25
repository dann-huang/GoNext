'use client';

import { MinesweeperBoard } from '@/components/games/MinesweeperBoard';
import { InfoCard } from '@/components/UI/InfoCard';
import { useState } from 'react';

export default function MinesweeperPage() {
  const [size, setSize] = useState({
    rows: 4,
    cols: 4,
    mines: 2,
  });

  return <div className="w-full flex flex-col">
    <header className='w-full border-b border-border p-4'>
      <div className='flex items-center gap-2'>
        <h1 className='text-xl font-semibold'>Minesweeper</h1>
        <InfoCard width={250}>
          <p className='text-primary'>Normal Minesweeper rules</p>
          <p className='text-sm'>- left click/touch to reveal cells</p>
          <p className='text-sm'>- right click/hold to place flags</p>
          <p className='text-sm'>- reveal all non-mine cells to win</p>
        </InfoCard>
      </div>
    </header>

    <div className="flex-1 flex justify-center items-center touch-none select-none">
      <div className='w-full max-w-md'>
        <MinesweeperBoard rows={size.rows} cols={size.cols} mines={size.mines} />
      </div>
    </div>
  </div>;
}
