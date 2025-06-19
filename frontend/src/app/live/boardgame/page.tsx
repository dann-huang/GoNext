'use client';

import { useMemo } from 'react';
import { useUserStore } from '@/hooks/userStore';
import { GAME_NAMES, GameName } from '@/types/wsTypes';
import { TicTacToeBoard } from '@/components/games/TicTacToeBoard';
import { Connect4Board } from '@/components/games/Connect4Board';
import { GameStatus } from '@/components/games/GameStatus';
import { CreateGame } from '@/components/games/CreateGame';
import { GameBoardProps } from '@/types/gameTypes';
import useBoardGame from '@/hooks/useBoardGame';
import { GAME_DISPLAY_NAMES } from '@/config/consts';

type GameBoardComponent = React.ComponentType<GameBoardProps>;

const GAME_BOARDS: Record<GameName, GameBoardComponent> = {
  tictactoe: TicTacToeBoard,
  connect4: Connect4Board,
};

export default function BoardGamePage() {
  const { gameState, createGame, joinGame, leaveGame, makeMove, isLoading } = useBoardGame();
  const username = useUserStore(state => state.username);
  const isPlayerInGame = username && gameState.players.includes(username);
  const showGameLobby = !gameState.gameName || (gameState.status === 'waiting' && !isPlayerInGame);

  const GameBoard = gameState.gameName ? GAME_BOARDS[gameState.gameName] : null;

  const handleCreateGame = async (gameName: GameName) => {
    try {
      await createGame(gameName);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  if (!gameState.gameName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <CreateGame
          onCreateGame={handleCreateGame}
          isLoading={isLoading}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GameStatus
        gameState={gameState}
        joinGame={joinGame}
        leaveGame={leaveGame}
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="container mx-auto h-full">
          {showGameLobby ? (
            <CreateGame
              onCreateGame={handleCreateGame}
              className="h-full flex items-center justify-center"
            />
          ) : (
            <div className="bg-background rounded-xl shadow-lg h-full flex items-center justify-center p-6">
              {GameBoard ? (
                <div className="w-full max-w-md">
                  <GameBoard
                    gameState={gameState}
                    onMove={makeMove}
                  />
                </div>
              ) : (
                <div>Game type not supported</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}