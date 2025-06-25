import Button from '@/components/UI/Button';
import { Select } from '@/components/UI/Select';
import { RefreshCw, Flag } from 'lucide-react';
import { GameStatus } from '@/hooks/useMinesweeper';
import { useEffect, useState } from 'react';

type Difficulty = 'beginner' | 'intermediate' | 'expert';

type DifficultySettings = {
  rows: number;
  cols: number;
  mines: number;
};

const DIFFICULTIES: Record<Difficulty, DifficultySettings> = {
  beginner: { rows: 9, cols: 16, mines: 20 },
  intermediate: { rows: 12, cols: 20, mines: 45 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

interface ToolbarProps {
  gameState: GameStatus;
  remainingMines: number;
  reset: () => void;
  setDiff: (diff: { rows: number; cols: number; mines: number }) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function MineToolbar({ gameState, reset, remainingMines, setDiff }: ToolbarProps) {
  const [time, setTime] = useState(0);

  const handleDifficultyChange = (difficulty: string) => {
    console.log(difficulty)
    const settings = DIFFICULTIES[difficulty as Difficulty];
    setDiff(settings);
    reset();
  };

  const displayStatus = () => {
    switch (gameState.status) {
      case 'won':
        return 'You Won!';
      case 'lost':
        return 'Game Over';
      case 'playing':
        return 'Playing...';
      default:
        return 'Ready';
    }
  };

  useEffect(() => {
    if (gameState.status !== 'playing') {
      return setTime(0);
    }
    const interval = setInterval(() => {
      setTime(Math.floor((Date.now() - gameState.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.startTime, gameState.status]);

  return <div className='flex items-center justify-between p-2 pb-0 flex-wrap bg-surface rounded-t-lg'>
    <div className='flex items-center gap-4'>
      <Button
        variant='ghost'
        size='sm'
        onClick={reset}
        aria-label='New Game'
      >
        <RefreshCw className='h-4 w-4' />
      </Button>
      <div className='text-sm font-medium'>
        {displayStatus()}
      </div>
    </div>

    <div className='w-32'>
      <Select
        variant='ghost'
        selectSize='sm'
        text='Difficulty'
        onChange={(value) => handleDifficultyChange(value)}
        options={Object.keys(DIFFICULTIES)}
        className='w-full'
        menuClassName='w-full'
      />
    </div>

    <div className='flex items-center gap-4'>
      <div className='flex items-center gap-1 text-sm'>
        <Flag className='h-4 w-4 text-error' />
        <span>{remainingMines}</span>
      </div>
      <div className='flex items-center gap-1 text-sm'>
        <span className='tabular-nums'>{formatTime(time)}</span>
      </div>
    </div>
  </div>;
}
