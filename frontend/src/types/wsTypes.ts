export type WsStatus = 'disconnected' | 'connecting' | 'connected';

export const Chat = 'chat' as const;
export const VidSignal = 'video_signal' as const;
export const RawSignal = 'raw_signal' as const;
export const GameState = 'game_state' as const;
export const JoinRoom = 'join_room' as const;
export const LeaveRoom = 'leave_room' as const;
export const GetRoom = 'get_rooms' as const;
export const GetClients = 'get_clients' as const;
export const Error = 'error' as const;
export const Status = 'status' as const;
export const Draw = 'draw' as const;

export interface ErrorMsg {
  type: typeof Error;
  sender: '_server';
  payload: {
    message: string;
  };
}

export interface StatusMsg {
  type: typeof Status;
  sender: '_server';
  payload: {
    message: string;
  };
}

export interface JoinRoomMsg {
  type: typeof JoinRoom;
  sender: string;
  payload: {
    roomName: string;
  };
}

export interface LeaveRoomMsg {
  type: typeof LeaveRoom;
  // Payload: {};
}

export interface ChatMsg {
  type: typeof Chat;
  sender: string;
  payload: {
    message: string;
    displayName: string;
  };
}

export interface VidSignalMsg {
  type: typeof VidSignal;
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
  type: typeof GetClients;
  sender: '_server';
  payload: {
    roomName: string;
    clients: string[];
  };
}

export interface GetClientsReq {
  type: typeof GetClients;
  // Payload: {};
}

export interface DrawPayload {
  type: 'draw';
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
}

export interface RawDrawMsg {
  type: typeof RawSignal;
  sender: string;
  payload: DrawPayload;
}


//------------------------------Game state stuff--------------------------------
export const GAME_NAMES = ['tictactoe', 'connect4'] as const;
export type GameName = typeof GAME_NAMES[number];

export interface BoardGameState {
  gameName: GameName | '';
  players: string[];
  turn: string;
  board: number[][];
  status: 'waiting' | 'in_progress' | 'win' | 'draw' | 'disconnected';
  winner?: string;
}

export interface Position {
  row: number;
  col: number;
}

export interface GameMove {
  from?: Position;
  to: Position;
}

export interface GamePayload {
  action: 'get' | 'create' | 'join' | 'leave' | 'move';
  gameName?: GameName;
  move?: GameMove;
}

export interface OutgoingGameState {
  type: typeof GameState;
  sender: string;
  payload: GamePayload;
}

export interface IncomingGameState {
  type: typeof GameState;
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
  | GetClientsReq
  | RawDrawMsg

export type DisplayableMsg =
  | ChatMsg
  | ErrorMsg
  | StatusMsg