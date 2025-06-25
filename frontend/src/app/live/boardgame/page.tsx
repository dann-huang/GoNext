'use client';

import { GameName } from '@/types/wsTypes';
import TicTacToeBoard from '@/components/games/TicTacToeBoard';
import Connect4Board from '@/components/games/Connect4Board';
import ChessBoard from '@/components/games/chess/ChessBoard';
import GameStatus from '@/components/games/GameStatus';
import CreateGame from '@/components/games/CreateGame';
import { GameBoardProps } from '@/types/gameTypes';
import useBoardGame from '@/hooks/useWSGame';
import { useWebSocket } from '@/hooks/useWebsocket';
import { GAME_DISPLAY_NAMES } from '@/config/consts';
import { Trophy } from 'lucide-react';

type GameBoardComponent = React.ComponentType<GameBoardProps>;

const GAME_BOARDS: Record<string, GameBoardComponent> = {
  tictactoe: TicTacToeBoard,
  connect4: Connect4Board,
  chess: ChessBoard,
};
export default function BoardGamePage() {
  const { currentRoom } = useWebSocket();
  const { gameState, createGame, joinGame, leaveGame, makeMove } = useBoardGame();
  const GameBoard = gameState.gameName ? GAME_BOARDS[gameState.gameName] : null;

  const handleCreateGame = async (gameName: GameName) => {
    try {
      createGame(gameName);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  return <div className='w-full flex flex-col relative'>
    {(gameState.status === 'finished') && <div className='fixed inset-0 z-10 flex items-center justify-center pointer-events-none'>
      <div className='text-6xl font-extrabold text-accent bg-secondary/70 px-8 py-6 rounded-xl -rotate-12 flex items-center gap-6 animate-pulse'>
        <Trophy className='w-20 h-20 ' />
        {gameState.winner == '' ? 'Nobody' : gameState.winner} Wins!
        <Trophy className='w-20 h-20 ' />
      </div>
    </div>}
    <header className='w-full border-b border-primary p-4 flex justify-between'>
      <div>
        <h1 className='text-xl font-semibold'>Board Game</h1>
        <p className='text-sm text-text/70'>Room: {currentRoom}</p>
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

    <div className='flex-1 flex justify-center items-center'>
      {gameState.gameName !== ''
        ? GameBoard ?
          <div className='w-full max-w-md touch-none select-none'>
            <GameBoard
              gameState={gameState}
              makeMove={makeMove}
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