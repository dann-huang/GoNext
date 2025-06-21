import { BoardGameState, GameMove } from './wsTypes';


export interface GameBoardProps {
    gameState: BoardGameState;
    makeMove: (move: GameMove) => void;
}