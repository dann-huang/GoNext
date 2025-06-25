import { useState } from 'react';
import { produce } from 'immer';

export type MineBoardProps = {
  rows: number;
  cols: number;
  mines: number;
};

type Cell = {
  state: 'hidden' | 'flagged' | 'revealed';
  hasMine: boolean;
  adj: number;
};

type GameStatus = {
  status: 'waiting' | 'playing' | 'won' | 'lost';
  revealed: number;
  flagged: number;
  board: Cell[][];
};

const createEmptyBoard = ({ rows, cols }: MineBoardProps) => Array(rows).fill(null).map(() =>
  Array(cols).fill(null).map((): Cell => ({
    state: 'hidden',
    hasMine: false,
    adj: 0,
  }))
)

const generateMines = (state: GameStatus, mines: number) => {
  const possibleCoords: [number, number][] = [];
  state.board.forEach((cellRow, row) => cellRow.forEach((cell, col) => {
    if (cell.state === 'hidden') possibleCoords.push([row, col]);
  }));
  for (let i = possibleCoords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possibleCoords[i], possibleCoords[j]] = [possibleCoords[j], possibleCoords[i]];
  }

  for (let i = 0; i < mines; i++)
    state.board[possibleCoords[i][0]][possibleCoords[i][1]].hasMine = true

  for (let i = 0; i < mines; i++) {
    const row = possibleCoords[i][0]
    const col = possibleCoords[i][1]
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (row + r < 0 || row + r >= state.board.length
          || col + c < 0 || col + c >= state.board[0].length) continue;
        state.board[row + r][col + c].adj++;
      }
    }
  }
}

const revealHelper = (state: GameStatus, row: number, col: number, recursive: boolean = true) => {
  if (row < 0 || row >= state.board.length || col < 0 || col >= state.board[0].length) return;
  if (state.board[row][col].state !== 'hidden') return;
  state.board[row][col].state = 'revealed'
  state.revealed++;
  if (state.board[row][col].adj !== 0 || !recursive) return;
  for (let r = -1; r <= 1; r++)
    for (let c = -1; c <= 1; c++)
      revealHelper(state, row + r, col + c);
}

export default function useMinesweeper(props: MineBoardProps) {
  const [gameState, setState] = useState<GameStatus>({
    status: 'waiting',
    revealed: 0,
    flagged: 0,
    board: createEmptyBoard(props),
  });

  const reveal = (row: number, col: number) => {
    if (gameState.status === 'waiting')
      return setState(produce(state => {
        for (let r = -1; r <= 1; r++)
          for (let c = -1; c <= 1; c++)
            revealHelper(state, row + r, col + c, false);
        generateMines(state, props.mines);
        state.status = 'playing';
      }));
    if (gameState.status !== 'playing' || gameState.board[row][col].state !== 'hidden') return;
    setState(produce(state => {
      if (state.board[row][col].hasMine) {
        state.board[row][col].state = 'revealed'
        state.status = 'lost';
      } else {
        revealHelper(state, row, col);
        const winCon = state.board.length * state.board[0].length - props.mines;
        state.status = state.revealed === winCon ? 'won' : 'playing';
      }
    }));
  }
  const flag = (row: number, col: number) => {
    if (gameState.status !== 'playing' ||
      gameState.board[row][col].state === 'revealed') return;

    setState(produce(state => {
      if (state.board[row][col].state === 'flagged') {
        state.board[row][col].state = 'hidden';
        state.flagged--;
      } else {
        state.board[row][col].state = 'flagged';
        state.flagged++;
      }
    }));
  }

  return { gameState, reveal, flag };
}

