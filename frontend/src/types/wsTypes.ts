export type WsStatus = 'disconnected' | 'connecting' | 'connected';

export const msgError = 'error' as const;
export const msgStatus = 'status' as const;
export const msgChat = 'chat' as const;
export const msgVidSignal = 'video_signal' as const;
export const msgRawSignal = 'raw_signal' as const;
export const msgGameState = 'game_state' as const;
export const msgJoinRoom = 'join_room' as const;
export const msgLeaveRoom = 'leave_room' as const;
export const msgGetRooms = 'get_rooms' as const;
export const msgGetClients = 'get_clients' as const;

export interface ErrorMsg {
  type: typeof msgError;
  sender: '_server';
  payload: {
    message: string;
  };
}

export interface StatusMsg {
  type: typeof msgStatus;
  sender: '_server';
  payload: {
    message: string;
  };
}

export interface JoinRoomMsg {
  type: typeof msgJoinRoom;
  sender: string;
  payload: {
    roomName: string;
  };
}

export interface LeaveRoomMsg {
  type: typeof msgLeaveRoom;
  // Payload: {};
}

export interface ChatMsg {
  type: typeof msgChat;
  sender: string;
  payload: {
    message: string;
    displayName: string;
  };
}

export interface VidSignalMsg {
  type: typeof msgVidSignal;
  sender: string;
  payload: {
    type: 'join' | 'leave' | 'offer' | 'answer' | 'ice';
    target: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  };
}

export interface GetClientRes {
  type: typeof msgGetClients;
  sender: '_server';
  payload: {
    roomName: string;
    clients: string[];
  };
}

export interface DrawPayload {
  type: 'draw';
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
}

export interface RawDrawMsg {
  type: typeof msgRawSignal;
  sender: string;
  payload: DrawPayload;
}


//------------------------------Game state stuff--------------------------------
export const GAME_NAMES = ['tictactoe', 'connect4', 'chess'] as const;
export type GameName = typeof GAME_NAMES[number];

export interface BoardGameState {
  gameName: GameName | '';
  players: string[];
  turn: number;
  board: number[][];
  status: 'waiting' | 'in_progress' | 'finished' | 'disconnected';
  winner: string;
  validMoves: GameMove[];
}

export interface Position {
  row: number;
  col: number;
}

export interface GameMove {
  from?: Position;
  to: Position;
  change?: string;
}

export interface GamePayload {
  action: 'get' | 'create' | 'join' | 'leave' | 'move';
  gameName?: GameName;
  move?: GameMove;
}

export interface OutgoingGameState {
  type: typeof msgGameState;
  sender: string;
  payload: GamePayload;
}

export interface IncomingGameState {
  type: typeof msgGameState;
  sender: '_server';
  payload: BoardGameState;
}


export type IncomingMsg =
  | ChatMsg
  | VidSignalMsg
  | IncomingGameState
  | JoinRoomMsg
  | GetClientRes
  | ErrorMsg
  | StatusMsg
  | RawDrawMsg

export type OutgoingMsg =
  | ChatMsg
  | VidSignalMsg
  | OutgoingGameState
  | JoinRoomMsg
  | LeaveRoomMsg
  | RawDrawMsg

export type DisplayableMsg =
  | ChatMsg
  | ErrorMsg
  | StatusMsg