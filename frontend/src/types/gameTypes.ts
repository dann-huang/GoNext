import { BoardGameState, GameMove } from './wsTypes';


export interface GameBoardProps {
    gameState: BoardGameState;
    onMove: (move: GameMove) => void;
}