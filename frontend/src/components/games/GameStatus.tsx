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
  const canJoin = !isPlaying && gameState.status === 'waiting';

  let statusMessage = '';
  let statusClass = 'text-foreground';
  let actionButton = null;

  switch (gameState.status) {
    case 'waiting':
      statusMessage = 'Waiting for players...';
      break;

    case 'in_progress':
      if (!isPlaying) {
        statusMessage = 'Game in progress';
      } else if (isTurn) {
        statusMessage = 'Your turn!';
        statusClass = 'text-green-500 font-medium';
      } else {
        statusMessage = `${gameState.turn}'s turn`;
      }
      break;

    case 'win':
      if (gameState.winner === username) {
        statusMessage = 'You won! 🎉';
        statusClass = 'text-green-500 font-medium';
      } else if (gameState.winner) {
        statusMessage = `${gameState.winner} won!`;
      } else {
        statusMessage = 'Game over';
      }
      break;

    case 'draw':
      statusMessage = "It's a draw!"
      statusClass = 'text-amber-500';
      break;

    case 'disconnected':
      statusMessage = 'Opponent disconnected';
      statusClass = 'text-amber-500';
      break;

    default:
      statusMessage = 'Game status unknown';
  }

  if (canJoin) {
    actionButton = (
      <Button
        onClick={joinGame}
        variant="secondary"
        disabled={isGameFull}
        className="min-w-[100px]"
      >
        Join Game
      </Button>
    );
  } else if (isPlaying && gameState.status !== 'disconnected') {
    actionButton = (
      <Button
        onClick={leaveGame}
        variant="destructive"
        outline
        className="min-w-[100px]"
      >
        Leave Game
      </Button>
    );
  } else if (gameState.status === 'disconnected') {
    actionButton = (
      <Button
        onClick={leaveGame}
        variant="ghost"
        className="text-foreground/70 hover:text-foreground"
      >
        Back to Lobby
      </Button>
    );
  }

  if (!gameState.gameName) return null;

  return <div className="p-4 bg-card shadow-sm border-b border-primary">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          {GAME_DISPLAY_NAMES[gameState.gameName]}
        </h2>
        <p className={cn('text-sm', statusClass)}>
          {statusMessage}
          {gameState.players.length > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              ({gameState.players.join(' vs ')})
            </span>
          )}
        </p>
      </div>

      {actionButton && (
        <div className="flex-shrink-0">
          {actionButton}
        </div>
      )}
    </div>
  </div>;
}
