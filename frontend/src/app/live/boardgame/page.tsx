'use client';

import { useMemo } from 'react';
import { useUserStore } from '@/hooks/userStore';
import { GAME_NAMES } from '@/types/wsTypes';
import { GAME_DISPLAY_NAMES } from '@/config/consts';
import { GameName } from '@/types/wsTypes';
import { TicTacToeBoard } from '@/components/games/TicTacToeBoard';
import { Connect4Board } from '@/components/games/Connect4Board';
import { GameBoardProps } from '@/types/gameTypes';
import useBoardGame from '@/hooks/useBoardGame';
import Button from '@/components/UI/Button';

const GAME_BOARDS: Record<GameName, React.ComponentType<GameBoardProps>> = {
  tictactoe: TicTacToeBoard,
  connect4: Connect4Board,
} as const;

const placeholder = (prop: GameBoardProps) => <div className="w-full h-64 bg-secondary/50 rounded-lg flex items-center justify-center">
  <p className="text-muted-foreground">
    Game board for coming soon
  </p>
</div>

export default function BoardGamePage() {
  const { username } = useUserStore();
  const {
    gameState,
    createGame,
    joinGame,
    leaveGame,
    makeMove,
  } = useBoardGame();

  const isPlayerInGame = useMemo(
    () => username ? gameState.players.includes(username) : false,
    [username, gameState.players]
  );

  if (gameState.gameName === '') {
    return <div className="h-screen w-screen bg-secondary flex flex-col items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          Create a New Game
        </h1>
        <div className="space-y-4">
          {GAME_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => createGame(name)}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg 
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              Play {GAME_DISPLAY_NAMES[name]}
            </button>
          ))}
        </div>
      </div>
    </div>;
  }

  const GameBoard = GAME_BOARDS[gameState.gameName];

  return <div className="h-screen w-screen flex flex-col bg-secondary">
    <div className="p-6 bg-primary text-primary-foreground">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {GAME_DISPLAY_NAMES[gameState.gameName] || 'Game In Progress'}
          </h1>
          <div className="mt-2 text-primary/80">
            Status: <span className="font-medium capitalize">{gameState.status.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {!isPlayerInGame
            ? <Button onClick={joinGame}>Join Game</Button>
            : <Button onClick={leaveGame}>Leave Game</Button>
          }
        </div>
      </div>
    </div>

    <div className="flex-1 p-6 overflow-auto">
      <div className="container mx-auto h-full">
        <div className="bg-background rounded-xl shadow-lg h-full flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <GameBoard
              gameState={gameState}
              onMove={makeMove}
            />
          </div>
        </div>
      </div>
    </div>
  </div>;
}