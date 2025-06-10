export type WsStatus = 'disconnected' | 'connecting' | 'connected';

export const msgChat = 'chat' as const;
export const msgVidSignal = 'video_signal' as const;
export const msgGameState = 'game_state' as const;
export const msgJoinRoom = 'join_room' as const;
export const msgLeaveRoom = 'leave_room' as const;
export const msgGetRooms = 'get_rooms' as const;
export const msgGetClients = 'get_clients' as const;
export const msgError = 'error' as const;
export const msgStatus = 'status' as const;


export interface IncomingChat {
  Type: typeof msgChat;
  Sender: string;
  Payload: {
    text: string;
    displayname: string;
  };
}

export interface IncomingVidSignal {
  Type: typeof msgVidSignal;
  Sender: string;
  Payload: unknown; //todo
}

export interface IncomingGameState {
  Type: typeof msgGameState;
  Sender: string;
  Payload: unknown; //todo
}

export interface IncomingJoinRoom {
  Type: typeof msgJoinRoom;
  Sender: '_server';
  Payload: {
    roomName: string;
  };
}

export interface IncomingGetClients {
  Type: typeof msgGetClients;
  Sender: '_server';
  Payload: {
    roomName: string;
    clients: string[];
  };
}

export interface IncomingError {
  Type: typeof msgError;
  Sender: '_server';
  Payload: {
    error: string;
  };
}

export interface IncomingStatus {
  Type: typeof msgStatus;
  Sender: '_server';
  Payload: {
    status: string;
  };
}

export type IncomingMsg =
  | IncomingChat
  | IncomingVidSignal
  | IncomingGameState
  | IncomingJoinRoom
  | IncomingGetClients
  | IncomingError
  | IncomingStatus;


export interface OutgoingChat {
  Type: typeof msgChat;
  Payload: {
    text: string;
    displayName: string;
  };
}

export interface OutgoingJoinRoom {
  Type: typeof msgJoinRoom;
  Payload: {
    roomName: string;
  };
}

export interface OutgoingLeaveRoom {
  Type: typeof msgLeaveRoom;
  // Payload: {};
}

export interface OutgoingGetClientsRequest {
  Type: typeof msgGetClients;
  // Payload: {};
}

export type OutgoingMsg =
  | OutgoingChat
  | OutgoingJoinRoom
  | OutgoingLeaveRoom
  | OutgoingGetClientsRequest;