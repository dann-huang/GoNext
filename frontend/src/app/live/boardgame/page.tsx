'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { useUserStore } from '@/hooks/userStore';
import { BoardGameState, GameName, GameMove } from '@/types/wsTypes';
import { GAME_NAMES } from '@/types/wsTypes';
import { GAME_DISPLAY_NAMES } from '@/config/consts';
import { TicTacToeBoard } from '@/components/games/TicTacToeBoard';

interface GameControlsProps {
  gameName: GameName | '';
  status: string;
  players: string[];
  currentUser: string | null;
  gameState: BoardGameState;
  username: string | null;
  onCreateGame: (gameName: GameName) => void;
  onJoinGame: () => void;
  onLeaveGame: () => void;
  onMove: (move: GameMove) => void;
  board: number[][];
}

const GameControls = ({
  gameName,
  status,
  players,
  currentUser,
  gameState,
  username,
  onCreateGame,
  onJoinGame,
  onLeaveGame,
  onMove,
  board
}: GameControlsProps) => {
  const isPlayerInGame = useMemo(
    () => currentUser ? players.includes(currentUser) : false,
    [currentUser, players]
  );

  if (!gameName) {
    return (
      <div className="h-screen w-screen bg-secondary flex flex-col items-center justify-center p-4">
        <div className="bg-background rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
            Create a New Game
          </h1>
          <div className="space-y-4">
            {GAME_NAMES.map((name) => (
              <button
                key={name}
                onClick={() => onCreateGame(name)}
                className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg 
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Play {GAME_DISPLAY_NAMES[name]}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen w-screen flex flex-col bg-secondary">
      <div className="p-6 bg-primary text-primary-foreground">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {GAME_DISPLAY_NAMES[gameName as GameName] || 'Game In Progress'}
            </h1>
            <div className="mt-2 text-primary/80">
              Status: <span className="font-medium capitalize">{status.replace('_', ' ')}</span>
            </div>
          </div>

          {currentUser && (
            <div className="flex space-x-2">
              {!isPlayerInGame ? (
                <button
                  onClick={onJoinGame}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg transition-colors"
                >
                  Join Game
                </button>
              ) : (
                <button
                  onClick={onLeaveGame}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors"
                >
                  Leave Game
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="container mx-auto h-full">
          <div className="bg-background rounded-xl shadow-lg h-full flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              {gameName === 'tictactoe' && (
                <TicTacToeBoard
                  board={board}
                  currentPlayer={gameState.turn}
                  isYourTurn={gameState.turn === currentUser}
                  onMove={onMove}
                />
              )}
              {gameName !== 'tictactoe' && (
                <div className="w-full h-64 bg-secondary/50 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Game board for {gameName} coming soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



export default function BoardGamePage() {
  const [gameState, setGameState] = useState<BoardGameState>({
    gameName: '',
    players: [],
    turn: '',
    board: Array(3).fill(null).map(() => Array(3).fill(0)), // Initialize empty 3x3 board with 0s
    status: 'waiting'
  });

  const sendGameMsg = useWebSocket(s => s.sendGameMsg);
  const setGameHandler = useWebSocket(s => s.setGameHandler);
  const { username } = useUserStore();

  const handleJoinGame = useCallback(() => {
    sendGameMsg({ action: 'join' });
  }, [sendGameMsg]);

  const handleLeaveGame = useCallback(() => {
    if (confirm('Are you sure you want to leave the game?')) {
      sendGameMsg({ action: 'leave' });
    }
  }, [sendGameMsg]);

  const handleCreateGame = useCallback((gameName: GameName) => {
    sendGameMsg({ action: 'create', gameName });
  }, [sendGameMsg]);

  const handleMove = useCallback((move: GameMove) => {
    sendGameMsg({ 
      action: 'move',
      move
    });
  }, [sendGameMsg]);

  // Pass the handleMove function to GameControls
  const gameControlsProps = {
    gameName: gameState.gameName,
    status: gameState.status,
    players: gameState.players,
    currentUser: username,
    gameState,
    username,
    board: gameState.board,
    onCreateGame: handleCreateGame,
    onJoinGame: handleJoinGame,
    onLeaveGame: handleLeaveGame,
    onMove: handleMove
  };

  useEffect(() => {
    const handleGameState = (data: BoardGameState) => {
      console.log('Received game state:', data);
      setGameState(data);
    };

    setGameHandler(handleGameState);
    sendGameMsg({ action: 'get' });

    return () => {
      setGameHandler(null);
    };
  }, [setGameHandler, sendGameMsg]);

  return <GameControls {...gameControlsProps} />;
}