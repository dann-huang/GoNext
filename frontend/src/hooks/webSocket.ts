'use client';

import { useEffect } from 'react';
import { useUserStore } from './userStore';
import * as t from '@/types/wsTypes';
import { create } from 'zustand';
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

  sendChat: (text: string) => void;
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

export const useWebSocket = create<WSState>()((set, get) => ({
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
      return console.warn('WS nothing to connect')
    if (!useUserStore.getState().loggedin())
      return console.error('WS needs authentication')

    set({ error: '' })

    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      console.debug('WS connected')
    }

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg: t.IncomingMsg = JSON.parse(e.data);

        switch (msg.type) {
          case t.Chat:
          case t.Status:
          case t.Error:
            set(state => ({ ...state, msgLog: [...state.msgLog, msg] }));
            break;

          case t.RawSignal:
            if (drawHandler) {
              drawHandler(msg.payload);
            }
            break;

          case t.GameState:
            if (gameHandler) {
              gameHandler(msg.payload);
            }
            break;

          case t.VidSignal:
            if (vidSigHandler === null) {
              console.warn('WS received vid signal, but no handler');
            } else {
              vidSigHandler(msg);
            }
            break;

          case t.JoinRoom:
            set({ currentRoom: msg.payload.roomName });
            break;
          case t.GetClients:
            set({ clients: msg.payload.clients, currentRoom: msg.payload.roomName })
            break;
          default:
            console.warn('Unknown message', msg);
        }
      } catch (err) {
        console.error('WS onmessage failed', e.data, err)
        set({ error: 'WS onmessage failed' })
      }
    }

    ws.onerror = (event) => {
      console.error('WS error:', event);
      set({ error: 'WS error' });
    };

    ws.onclose = (event) => {
      console.debug('WS closed:', event.code, event.reason);
      set({ error: `WS disconnected: code ${event.code}, reason: ${event.reason || 'Unknown'}.` });

      ws = null;
    }
  },
  disconnect: () => {
    if (ws) {
      console.debug('Closing WS');
      ws.close(1000, 'Client wants to leave');
      ws = null;
    }
    set({ currentRoom: '', msgLog: [], clients: [], error: '' })
  },
  sendMessage: (msg: t.OutgoingMsg) => {
    if (!ws || get().getStatus() !== 'connected') {
      set({ error: 'WS not connected' })
      return console.warn('WS not connected')
    }
    try {
      ws.send(JSON.stringify(msg));
    } catch (err) {
      console.error('WS failed to send', msg, err);
      set({ error: 'WS failed to send' });
    }
  },
  sendChat: (message: string) => {
    const { username, displayName } = useUserStore.getState();
    const msg: t.ChatMsg = {
      type: t.Chat,
      sender: username,
      payload: { message, displayName }
    }
    get().sendMessage(msg);
  },
  joinRoom: (roomName: string) => {
    const msg: t.JoinRoomMsg = { type: t.JoinRoom, sender: '', payload: { roomName } }
    get().sendMessage(msg);
  },
  leaveRoom: () => {
    const msg: t.LeaveRoomMsg = { type: t.LeaveRoom }
    get().sendMessage(msg);
  },
  setVidSigHandler: handler => { vidSigHandler = handler },
  sendVidSignal: (payload: t.VidSignalMsg['payload']) => {
    const msg: t.VidSignalMsg = { type: t.VidSignal, sender: '', payload }
    get().sendMessage(msg);
  },
  setDrawHandler: (handler: (data: t.DrawPayload) => void) => { drawHandler = handler },
  setGameHandler: handler => { gameHandler = handler },
  sendGameMsg: (payload: t.GamePayload) => {
    const msg: t.OutgoingMsg = {
      type: t.GameState,
      sender: '',
      payload: payload,
    };
    get().sendMessage(msg);
  },
}))


export const useWSConnect = () => {
  const { loggedin, refresh, addRefreshDependent: addRefDependent, removeRefreshDependent: remRefDependent } = useUserStore();
  const { connect, disconnect, getStatus } = useWebSocket();

  useEffect(() => {
    let unmounted = false;

    const maybeConnect = async () => {
      if (unmounted) return;

      if (!loggedin()) {
        const ok = await refresh();
        if (!ok) {
          disconnect();
          return console.warn('not loggedin disconnect');
        }
      }

      if (getStatus() === 'disconnected') {
        connect();
      }
    };

    addRefDependent('ws');
    maybeConnect();

    const interval = setInterval(maybeConnect, RECONNECT_INITIAL_DELAY);

    return () => {
      unmounted = true;
      clearInterval(interval);
      disconnect();
      remRefDependent('ws');
      console.warn('not loggedin disconnect');
    };
  }, [loggedin, refresh, connect, disconnect, getStatus, addRefDependent, remRefDependent]);
};