'use client';

import React, { useState, useCallback } from 'react';
import { GameBoardProps } from '@/types/gameTypes';
import { useUserStore } from '@/hooks/userStore';
import { cn } from '@/lib/utils';
import { numToPiece, numToString } from './pieceMapping';


type Position = { row: number; col: number };
export function ChessBoard({ gameState, onMove }: GameBoardProps) {
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const username = useUserStore(state => state.username);
  const yourIdx = gameState.players.indexOf(username);
  const isYourTurn = gameState.status === 'in_progress' && gameState.turn === yourIdx;

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameState.status !== 'in_progress') return;

    const piece = gameState.board[row][col];
    const isPieceYours = piece >= 11 ? yourIdx === 0 : yourIdx === 1;

    // If a piece is already selected
    if (selectedPiece) {
      // If clicking on a valid move, make the move
      if (validMoves.some(move => move.row === row && move.col === col)) {
        onMove({
          from: { row: selectedPiece.row, col: selectedPiece.col },
          to: { row, col },
        });
        setSelectedPiece(null);
        setValidMoves([]);
      }
      // If clicking on another of your pieces, select that instead
      else if (piece !== 0 && isPieceYours) {
        setSelectedPiece({ row, col });
        // TODO: Calculate valid moves for the selected piece
        setValidMoves([]);
      }
      // Otherwise, deselect
      else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
    // If no piece is selected, select this one if it's yours
    else if (piece !== 0 && isPieceYours) {
      setSelectedPiece({ row, col });
      // TODO: Calculate valid moves for the selected piece
      setValidMoves([]);
    }
  }, [selectedPiece, validMoves, gameState, onMove, yourIdx]);

  // Determine if a square is a valid move
  const isValidMove = useCallback((row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col);
  }, [validMoves]);

  // Determine if a square is the selected piece
  const isSelected = useCallback((row: number, col: number) => {
    return selectedPiece?.row === row && selectedPiece?.col === col;
  }, [selectedPiece]);

  // TODO: Implement move validation logic
  // This is a placeholder - in a real implementation, you'd calculate valid moves
  // based on the selected piece and current board state
  const calculateValidMoves = useCallback((row: number, col: number) => {
    // This is where you'd implement the actual move validation logic
    // For now, return an empty array
    return [];
  }, []);

  return <div className="bg-amber-100 p-4 rounded-lg shadow-lg">
    <div className="grid grid-cols-8 border-2 border-amber-800">
      {gameState.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isLight = (rowIndex + colIndex) % 2 === 0;
          const Piece = numToPiece[cell];

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                'aspect-square flex items-center justify-center relative',
                isLight ? 'bg-amber-100' : 'bg-amber-800',
                isSelected(rowIndex, colIndex) && 'ring-4 ring-blue-500',
                isValidMove(rowIndex, colIndex) && 'bg-green-200/70',
                'cursor-pointer',
                'transition-colors duration-200',
                'hover:bg-opacity-80',
                'group'
              )}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {Piece && <Piece />}
              {isValidMove(rowIndex, colIndex) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1/4 h-1/4 rounded-full bg-black/30" />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
    <div className="mt-4 text-center">
      {gameState.status === 'in_progress' && (
        <p className="text-lg font-medium">
          {isYourTurn ? 'Your turn' : 'Waiting for opponent...'}
        </p>
      )}
      {gameState.status === 'finished' && gameState.winner && (
        <p className="text-lg font-bold text-green-700">
          {gameState.winner === username ? 'You win!' : `${gameState.winner} wins!`}
        </p>
      )}
    </div>
  </div>;
}
