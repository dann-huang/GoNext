'use client';

import { useUserStore } from '@/hooks/userStore';
import { BoardGameState } from '@/types/wsTypes';
import Button from '@/components/UI/Button';

interface GameStatusProps {
  gameState: BoardGameState;
  joinGame: () => Promise<void> | void;
  leaveGame: () => Promise<void> | void;
}

export function GameStatus({
  gameState,
  joinGame,
  leaveGame,
}: GameStatusProps) {
  const username = useUserStore(state => state.username);
  const idx = gameState.players.indexOf(username);
  const yourTurn = gameState.turn === idx;
  const canJoin = gameState.gameName && idx < 0 && gameState.status === 'waiting';

  const getStatusMessage = () => {
    if (!gameState.gameName) return 'Waiting for game...';
    switch (gameState.status) {
      case 'waiting':
        return 'Waiting for players...';
      case 'in_progress':
        return yourTurn ? 'Your turn!' : `${gameState.players[gameState.turn]} turn`;
      case 'win':
        if (gameState.winner === username) return 'You won! 🎉';
        if (gameState.winner) return `${gameState.winner} wins!`;
        return 'Game over';
      case 'draw':
        return 'It\'s a draw!';
      default:
        return 'Game starting...';
    }
  };

  return <div className='flex items-center justify-between py-2 px-4 bg-background'>
    <div className='text-sm'>
      <span className='font-medium'>Status: {getStatusMessage()}</span>
    </div>

    <div className='flex items-center gap-2'>
      {idx >= 0 ?
        <Button
          size='sm'
          onClick={leaveGame}
          className='text-xs'
        >Leave Game</Button>
        : <Button
          size='sm'
          onClick={joinGame}
          className='text-xs'
          disabled={!canJoin}
        >Join Game</Button>}
    </div>
  </div>;
}