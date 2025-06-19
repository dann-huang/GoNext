import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWebSocket } from './webSocket';
import { useUserStore } from './userStore';
import { BoardGameState, GameMove, GameName } from '@/types/wsTypes';

export default function useBoardGame() {
  const { sendGameMsg, setGameHandler } = useWebSocket();
  const username = useUserStore(state => state.username);

  const [gameState, setGameState] = useState<BoardGameState>({
    gameName: '', players: [], turn: '', board: [[]], status: 'waiting'
  });

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
  }, [sendGameMsg, setGameHandler]);

  const createGame = useCallback((gameName: GameName) => {
    sendGameMsg({ action: 'create', gameName });
  }, [sendGameMsg]);

  const joinGame = useCallback(() => {
    sendGameMsg({ action: 'join' });
  }, [sendGameMsg]);

  const leaveGame = useCallback(() => {
    if (confirm('Are you sure you want to leave the game?')) {
      sendGameMsg({ action: 'leave' });
    }
  }, [sendGameMsg]);

  const makeMove = useCallback((move: GameMove) => {
    sendGameMsg({
      action: 'move',
      move
    });
  }, [sendGameMsg]);

  return {
    gameState,
    createGame,
    joinGame,
    leaveGame,
    makeMove,
  };
}
