'use client';

import { useUserStore } from '@/hooks/userStore';
import { GameName } from '@/types/wsTypes';
import { TicTacToeBoard } from '@/components/games/TicTacToeBoard';
import { Connect4Board } from '@/components/games/Connect4Board';
import { GameStatus } from '@/components/games/GameStatus';
import { CreateGame } from '@/components/games/CreateGame';
import { GameBoardProps } from '@/types/gameTypes';
import useBoardGame from '@/hooks/useBoardGame';
import { useWebSocket } from '@/hooks/webSocket';
import { GAME_DISPLAY_NAMES } from '@/config/consts';

type GameBoardComponent = React.ComponentType<GameBoardProps>;

const GAME_BOARDS: Record<GameName, GameBoardComponent> = {
  tictactoe: TicTacToeBoard,
  connect4: Connect4Board,
};

export default function BoardGamePage() {
  const { currentRoom } = useWebSocket();
  const { gameState, createGame, joinGame, leaveGame, makeMove, isLoading } = useBoardGame();
  const username = useUserStore(state => state.username);

  const GameBoard = gameState.gameName ? GAME_BOARDS[gameState.gameName] : null;

  const handleCreateGame = async (gameName: GameName) => {
    try {
      await createGame(gameName);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  return <div className="w-full flex flex-col">
    <header className="w-full border-b border-primary p-4 flex justify-between">
      <div>
        <h1 className="text-xl font-semibold">Board Game</h1>
        <p className="text-sm text-text/70">Room: {currentRoom}</p>
      </div>
      <div>
        <div>Playing: {GAME_DISPLAY_NAMES[gameState.gameName]}</div>
        <div>Players: {gameState.players.join(', ') || 'N/A'}</div>
      </div>
    </header>
    <GameStatus
      gameState={gameState}
      joinGame={joinGame}
      leaveGame={leaveGame}
    />

    <div className="flex-1 flex flex-col justify-center items-center">
      {gameState.gameName !== ''
        ? GameBoard ?
          <div className="w-full max-w-md">
            <GameBoard
              gameState={gameState}
              onMove={makeMove}
            />
          </div>
          : <div>Game type not supported</div>
        : <CreateGame
          createGame={handleCreateGame}
        />
      }
    </div>
  </div >;
}