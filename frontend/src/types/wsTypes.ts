export type WsStatus = 'disconnected' | 'connecting' | 'connected';

export const Chat = 'chat' as const;
export const VidSignal = 'video_signal' as const;
export const GameState = 'game_state' as const;
export const JoinRoom = 'join_room' as const;
export const LeaveRoom = 'leave_room' as const;
export const GetRoom = 'get_rooms' as const;
export const GetClients = 'get_clients' as const;
export const Error = 'error' as const;
export const Status = 'status' as const;

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
  payload: unknown; //todo
}

export interface GameStateMsg {
  type: typeof GameState;
  sender: string;
  payload: unknown; //todo
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


export type IncomingMsg =
  | ChatMsg
  | VidSignalMsg
  | GameStateMsg
  | JoinRoomMsg
  | GetClientRes
  | ErrorMsg
  | StatusMsg;

export type OutgoingMsg =
  | ChatMsg
  | VidSignalMsg
  | GameStateMsg
  | JoinRoomMsg
  | LeaveRoomMsg
  | GetClientsReq;

export type DisplayableMsg =
  | ChatMsg
  | ErrorMsg
  | StatusMsg