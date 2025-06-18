'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { BoardGameState, GameName } from '@/types/wsTypes';

const GAME_NAMES: GameName[] = ['tictactoe', 'connect4'];
const GAME_DISPLAY_NAMES: Record<GameName, string> = {
  tictactoe: 'Tic Tac Toe',
  connect4: 'Connect 4',
};

export default function BoardGamePage() {
  const [gameState, setGameState] = useState<BoardGameState>({
    gameName: '', 
    players: [], 
    turn: '', 
    board: [], 
    status: 'waiting'
  });

  const sendGameMsg = useWebSocket(s => s.sendGameMsg);
  const setGameHandler = useWebSocket(s => s.setGameHandler);

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

  const handleCreateGame = (gameName: GameName) => {
    sendGameMsg({ action: 'create', gameName });
  };

  if (!gameState.gameName) {
    return (
      <div className="h-screen w-screen bg-secondary flex flex-col items-center justify-center p-4">
        <div className="bg-background rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
            Create a New Game
          </h1>
          <div className="space-y-4">
            {GAME_NAMES.map((gameName) => (
              <button
                key={gameName}
                onClick={() => handleCreateGame(gameName)}
                className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg 
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Play {GAME_DISPLAY_NAMES[gameName]}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render current game view
  return (
    <div className="h-screen w-screen flex flex-col bg-secondary">
      <div className="p-6 bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">
            {GAME_DISPLAY_NAMES[gameState.gameName as GameName] || 'Game In Progress'}
          </h1>
          <div className="mt-2 text-primary/80">
            Status: <span className="font-medium capitalize">{gameState.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
      
      {/* Game board container */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="container mx-auto h-full">
          <div className="bg-background rounded-xl shadow-lg h-full flex items-center justify-center p-6">
            <div className="w-full h-full bg-secondary/50 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Game board coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}