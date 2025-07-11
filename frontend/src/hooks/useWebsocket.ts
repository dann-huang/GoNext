'use client';

import { useEffect } from 'react';
import useUserStore from './useUserStore';
import * as t from '@/types/wsTypes';
import { create } from 'zustand';
import { useTokenRefresh } from './useTokenRefresh';
import { RECONNECT_INITIAL_DELAY, WS_URL } from '@/config/consts';

interface WSState {
  error: string;
  currentRoom: string;

  msgLog: t.DisplayableMsg[];
  clients: string[];

  gameStates: t.IncomingGameState[];
  boardGameState: t.BoardGameState | null;

  getStatus: () => t.WsStatus;
  getClients: () => string[];

  connect: () => void;
  disconnect: () => void;
  sendMessage: (msg: t.OutgoingMsg) => void;

  sendChat: (displayName: string, message: string) => void;
  joinRoom: (roomName: string) => void;
  leaveRoom: () => void;

  setVidSigHandler: (handler: ((msg: t.VidSignalMsg) => void) | null) => void;
  sendVidSignal: (payload: t.VidSignalMsg['payload']) => void;

  setDrawHandler: (handler: (data: t.DrawPayload) => void) => void;
  setGameHandler: (handler: ((data: t.BoardGameState) => void) | null) => void;
  sendGameMsg: (payload: t.GamePayload) => void;
}

let ws: WebSocket | null = null; //causes problems when defined in store

let vidSigHandler: ((msg: t.VidSignalMsg) => void) | null = null; //also causes rerendering issues
let drawHandler: ((msg: t.DrawPayload) => void) | null = null;
let gameHandler: ((data: t.BoardGameState) => void) | null = null;

const useWebSocket = create<WSState>()((set, get) => ({
  currentRoom: '',
  error: '',

  msgLog: [],
  clients: [],

  gameStates: [],
  boardGameState: null,

  getStatus: () => {
    if (ws === null) return 'disconnected';
    if (ws.readyState === WebSocket.OPEN) return 'connected';
    if (ws.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  },
  getClients: () => get().clients,
  connect: () => {
    if (get().getStatus() !== 'disconnected')
      return console.warn('WS nothing to connect');

    set({ error: '' });

    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      console.debug('WS connected');
    };

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg: t.IncomingMsg = JSON.parse(e.data);

        switch (msg.type) {
          case t.msgChat:
          case t.msgStatus:
          case t.msgError:
            set((state) => ({ ...state, msgLog: [...state.msgLog, msg] }));
            break;

          case t.msgRawSignal:
            if (drawHandler) {
              drawHandler(msg.payload);
            }
            break;

          case t.msgGameState:
            if (gameHandler) {
              gameHandler(msg.payload);
            }
            break;

          case t.msgVidSignal:
            if (vidSigHandler === null) {
              console.warn('WS received vid signal, but no handler');
            } else {
              vidSigHandler(msg);
            }
            break;

          case t.msgJoinRoom:
            set({ currentRoom: msg.payload.roomName });
            break;
          case t.msgGetClients:
            set({ clients: msg.payload.clients });
            break;
          default:
            console.warn('Unknown message', msg);
        }
      } catch (err) {
        console.error('WS onmessage failed', e.data, err);
        set({ error: 'WS onmessage failed' });
      }
    };

    ws.onclose = (event) => {
      console.debug('WS closed:', event.code, event.reason);
      set({
        error: `WS disconnected: code ${event.code}, reason: ${
          event.reason || 'Unknown'
        }.`,
      });

      ws = null;
    };
  },
  disconnect: () => {
    if (ws) {
      console.debug('Closing WS');
      ws.close(1000, 'Client wants to leave');
      ws = null;
    }
    console.debug('WS disconnect');
    set({ currentRoom: '', msgLog: [], clients: [], error: '' });
  },
  sendMessage: (msg: t.OutgoingMsg) => {
    if (!ws || get().getStatus() !== 'connected') {
      set({ error: 'WS not connected' });
      return console.warn('WS not connected');
    }
    try {
      ws.send(JSON.stringify(msg));
    } catch (err) {
      console.error('WS failed to send', msg, err);
      set({ error: 'WS failed to send' });
    }
  },
  sendChat: (displayName: string, message: string) => {
    const msg: t.ChatMsg = {
      type: t.msgChat,
      sender: '',
      payload: { message, displayName },
    };
    get().sendMessage(msg);
  },
  joinRoom: (roomName: string) => {
    const msg: t.JoinRoomMsg = {
      type: t.msgJoinRoom,
      sender: '',
      payload: { roomName },
    };
    get().sendMessage(msg);
  },
  leaveRoom: () => {
    const msg: t.LeaveRoomMsg = { type: t.msgLeaveRoom };
    get().sendMessage(msg);
  },
  setVidSigHandler: (handler) => {
    vidSigHandler = handler;
  },
  sendVidSignal: (payload: t.VidSignalMsg['payload']) => {
    const msg: t.VidSignalMsg = { type: t.msgVidSignal, sender: '', payload };
    get().sendMessage(msg);
  },
  setDrawHandler: (handler: (data: t.DrawPayload) => void) => {
    drawHandler = handler;
  },
  setGameHandler: (handler) => {
    gameHandler = handler;
  },
  sendGameMsg: (payload: t.GamePayload) => {
    const msg: t.OutgoingMsg = {
      type: t.msgGameState,
      sender: '',
      payload: payload,
    };
    get().sendMessage(msg);
  },
}));

export default useWebSocket;

const wsDependency = { type: 'websocket' } as const;

export const useWSConnect = () => {
  const { connect, disconnect, getStatus } = useWebSocket();
  const hasAccess = useTokenRefresh(wsDependency);

  useEffect(() => {
    if (!hasAccess) {
      if (getStatus() !== 'disconnected') {
        disconnect();
      }
      return;
    }
    if (getStatus() === 'disconnected') {
      connect();
    }

    const interval = setInterval(() => {
      if (getStatus() === 'disconnected') {
        connect();
      }
    }, RECONNECT_INITIAL_DELAY);

    return () => {
      clearInterval(interval);
      if (getStatus() !== 'disconnected') {
        disconnect();
      }
    };
  }, [connect, disconnect, getStatus, hasAccess]);
};
