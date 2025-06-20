'use client';

import { useUserStore } from '@/hooks/userStore';
import { BoardGameState } from '@/types/wsTypes';
import { GAME_DISPLAY_NAMES } from '@/config/consts';
import Button from '@/components/UI/Button';
import { cn } from '@/lib/utils';

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
  const isPlaying = username && gameState.players.includes(username);
  const isTurn = gameState.turn === username;
  const isGameFull = gameState.players.length >= 2;
  const canJoin = !isPlaying && gameState.status === 'waiting' && !isGameFull;

  const getStatusMessage = () => {
    if (!gameState.gameName) return 'Waiting for game...';
    switch (gameState.status) {
      case 'waiting':
        return 'Waiting for players...';
      case 'in_progress':
        if (isPlaying) {
          return isTurn ? 'Your turn!' : `${gameState.turn}'s turn`;
        }
        return 'Game in progress';
      case 'win':
        if (gameState.winner === username) return 'You won! 🎉';
        if (gameState.winner) return `${gameState.winner} wins!`;
        return 'Game over';
      case 'draw':
        return "It's a draw!";
      default:
        return 'Game starting...';
    }
  };


  return <div className="flex items-center justify-between py-2 px-4 bg-background">
    <div className="text-sm">
      <span className="font-medium">Status: {getStatusMessage()}</span>
    </div>

    <div className="flex items-center gap-2">
      {isPlaying ?
        <Button
          size="sm"
          onClick={leaveGame}
          className="text-xs"
        >Leave Game</Button>
        : canJoin ? <Button
          size="sm"
          onClick={joinGame}
          className="text-xs"
        >Join Game</Button>
          : null}
    </div>
  </div>;
}