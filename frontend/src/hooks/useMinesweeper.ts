import { useState, useEffect } from 'react';
import { produce } from 'immer';

type MineProps = {
  rows: number;
  cols: number;
  mines: number;
};

type Cell = {
  state: 'hidden' | 'flagged' | 'revealed';
  hasMine: boolean;
  adj: number;
};

export type GameStatus = {
  startTime: number;
  status: 'waiting' | 'playing' | 'won' | 'lost';
  mines: number;
  revealNeeded: number;
  revealed: number;
  flagged: number;
  board: Cell[][];
};

const initState = ({ rows, cols }: MineProps): GameStatus => ({
  startTime: 0,
  status: 'waiting',
  mines: 0,
  revealNeeded: 0,
  revealed: 0,
  flagged: 0,
  board: Array(rows).fill(null).map(() =>
    Array(cols).fill(null).map((): Cell => ({
      state: 'hidden',
      hasMine: false,
      adj: 0,
    }))
  ),
})

const generateMines = (state: GameStatus, mines: number, startRow: number, startCol: number) => {
  const possibleCoords: [number, number][] = [];
  state.board.forEach((cellRow, row) => cellRow.forEach((_, col) => {
    if (Math.abs(row - startRow) < 2 && Math.abs(col - startCol) < 2) return;
    possibleCoords.push([row, col]);
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
  state.mines = mines;
  state.revealNeeded = state.board.length * state.board[0].length - mines;
}

const revealCascade = (state: GameStatus, row: number, col: number) => {
  if (row < 0 || row >= state.board.length || col < 0 || col >= state.board[0].length) return;
  if (state.board[row][col].state !== 'hidden') return;
  state.board[row][col].state = 'revealed'
  state.revealed++;
  if (state.board[row][col].adj !== 0) return;
  for (let r = -1; r <= 1; r++)
    for (let c = -1; c <= 1; c++)
      revealCascade(state, row + r, col + c);
}

const revealHelper = (state: GameStatus, row: number, col: number) => {
  if (row < 0 || row >= state.board.length || col < 0 || col >= state.board[0].length) return;
  if (state.board[row][col].state !== 'hidden') return;
  state.board[row][col].state = 'revealed'
  state.revealed++;
  if (state.board[row][col].hasMine) state.status = 'lost';
  else if (state.revealed === state.revealNeeded) state.status = 'won';
}

export default function useMinesweeper(props: MineProps) {
  const [gameState, setState] = useState<GameStatus>(() => initState(props));
  useEffect(() => { setState(initState(props)) },
    [props.rows, props.cols, props.mines]);

  const reveal = (row: number, col: number) => {
    // start game
    if (gameState.status === 'waiting')
      return setState(produce(state => {
        generateMines(state, props.mines, row, col);
        revealCascade(state, row, col);
        state.status = 'playing';
        state.startTime = Date.now();
      }));
    if (gameState.status !== 'playing') return;

    //auto reveal
    if (gameState.board[row][col].state === 'revealed')
      setState(produce(state => {
        let flags = 0;
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            if (row + r < 0 || row + r >= state.board.length
              || col + c < 0 || col + c >= state.board[0].length) continue;
            if (state.board[row + r][col + c].state === 'flagged') flags++;
          }
        }
        if (flags === state.board[row][col].adj)
          for (let r = -1; r <= 1; r++)
            for (let c = -1; c <= 1; c++)
              revealHelper(state, row + r, col + c);
      }))
    //manual reveal
    else setState(produce(state => {
      if (state.board[row][col].hasMine) {
        state.board[row][col].state = 'revealed'
        state.status = 'lost';
      } else {
        revealCascade(state, row, col);
        state.status = state.revealed === state.revealNeeded ? 'won' : 'playing';
      }
    }));
  }
  const flag = (row: number, col: number) => {
    if (gameState.status !== 'playing') return;
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
  const reset = () => setState(initState(props));

  return { gameState, reveal, flag, reset };
}

