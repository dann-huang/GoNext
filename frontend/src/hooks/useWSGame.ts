import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebsocket';
import { BoardGameState, GameMove, GameName } from '@/types/wsTypes';

export default function useWebSocketGame() {
  const { sendGameMsg, setGameHandler } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);

  const [gameState, setGameState] = useState<BoardGameState>({
    gameName: '',
    players: [],
    turn: 0,
    board: [[]],
    status: 'waiting',
    winner: '',
    validMoves: []
  });

  const createGame = useCallback((gameName: GameName) => {
    try {
      setIsLoading(true);
      sendGameMsg({ action: 'create', gameName });
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sendGameMsg]);

  const joinGame = useCallback(() => {
    try {
      setIsLoading(true);
      sendGameMsg({ action: 'join' });
    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sendGameMsg]);

  const leaveGame = useCallback(() => {
    if (confirm('Are you sure you want to leave the game?')) {
      try {
        setIsLoading(true);
        sendGameMsg({ action: 'leave' });
      } catch (error) {
        console.error('Error leaving game:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  }, [sendGameMsg]);

  const makeMove = useCallback((move: GameMove) => {
    try {
      setIsLoading(true);
      sendGameMsg({
        action: 'move',
        move
      });
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sendGameMsg]);

  useEffect(() => {
    const handleGameState = (data: BoardGameState) => {
      console.debug('Received game state:', data);
      setGameState(data);
      setIsLoading(false);
    };

    setGameHandler(handleGameState);
    setIsLoading(true);
    sendGameMsg({ action: 'get' });

    return () => {
      setGameHandler(null);
    };
  }, [sendGameMsg, setGameHandler]);



  return {
    gameState,
    isLoading,
    createGame,
    joinGame,
    leaveGame,
    makeMove,
  };
}
