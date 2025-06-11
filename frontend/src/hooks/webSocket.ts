"use client";

import { useEffect } from 'react';
import { useUserStore } from './userStore';
import * as t from '@/types/wsTypes';
import { create } from 'zustand';
import { RECONNECT_MAX_DELAY, RECONNECT_INITIAL_DELAY, RECONNECT_MAX_ATTEMPTS, WS_URL } from '@/config/consts';

interface WSState {
  error: string;
  currentRoom: string;

  msgLog: t.DisplayableMsg[];
  clients: string[];

  gameStates: t.GameStateMsg[];

  getStatus: () => t.WsStatus,
  connect: () => void;
  disconnect: () => void;
  sendMessage: (msg: t.OutgoingMsg) => void;

  sendChat: (text: string) => void;
  joinRoom: (roomName: string) => void;
  leaveRoom: () => void;

  setVideoSignalHandler: (handler: (signal: unknown) => void) => void;
}

let ws: WebSocket | null = null; //causes problems when defined in store
let reconnTimeout: NodeJS.Timeout | null = null;
let reconnAttempt = 0;
let reconnDelay = RECONNECT_INITIAL_DELAY;

let vidSigHandler: ((signal: unknown) => void) | null = null; //also causes rerendering issues

export const useWebSocket = create<WSState>()((set, get) => ({
  currentRoom: "",
  error: "",

  msgLog: [],
  clients: [],

  gameStates: [],

  getStatus: () => {
    if (ws === null) return "disconnected";
    if (ws.readyState === WebSocket.OPEN) return "connected";
    if (ws.readyState === WebSocket.CONNECTING) return "connecting";
    return "disconnected";
  },
  connect: () => {
    if (get().getStatus() !== "disconnected")
      return console.warn("WS nothing to connect")
    if (!useUserStore.getState().loggedin())
      return console.error("WS needs authentication")

    set({ error: "" })
    if (reconnTimeout) {
      clearTimeout(reconnTimeout);
      reconnTimeout = null;
    }

    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      console.debug('WS connected')
      reconnAttempt = 0;
      reconnDelay = RECONNECT_INITIAL_DELAY;
    }

    ws.onmessage = e => {
      try {
        const msg: t.IncomingMsg = JSON.parse(e.data)

        //todo: lots
        switch (msg.type) {
          case t.Chat:
          case t.Status:
          case t.Error:
            set(state => ({ msgLog: [...state.msgLog, msg] }));
            break;
          case t.VidSignal:
            if (vidSigHandler === null) {
              console.warn("WS recieved vid signal, but no handler")
            } else {
              vidSigHandler(msg.payload)
            }
            break;
          case t.GameState:
            set(state => ({ gameStates: [...state.gameStates, msg] }));
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
        console.error("WS onmessage failed", e.data, err)
        set({ error: "WS onmessage failed" })
      }
    }

    ws.onerror = (event) => {
      console.error('WS error:', event);
      set({ error: 'WS error' });
    };

    ws.onclose = async (event) => {
      console.debug('WS closed:', event.code, event.reason);
      set({ error: `WS disconnected: code ${event.code}, reason: ${event.reason || 'Unknown'}.` });

      if (event.code === 1000 || event.code === 1001)
        return console.debug("WS closed gracefully");

      const loggedIn = await useUserStore.getState().refresh();
      if (!loggedIn) return console.error("WS died; require auth to reconnect");

      if (++reconnAttempt > RECONNECT_MAX_ATTEMPTS)
        return console.debug("WS died; reconnect unsuccessful");

      reconnDelay = Math.min(reconnDelay * 2, RECONNECT_MAX_DELAY);
      console.debug(`WS reconnect in ${reconnDelay / 1000}s...`);
      reconnTimeout = setTimeout(get().connect, reconnDelay);
    }
  },
  disconnect: () => {
    if (reconnTimeout) {
      clearTimeout(reconnTimeout);
      reconnTimeout = null;
    }

    if (ws) {
      console.debug("Closing WS");
      ws.close(1000, "Client wants to leave");
      ws = null;
    }
    set({ currentRoom: "", msgLog: [], clients: [], error: "" })
  },
  sendMessage: (msg: t.OutgoingMsg) => {
    if (!ws || get().getStatus() !== "connected") {
      set({ error: "WS not connected" })
      return console.warn("WS not connected")
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
    const msg: t.JoinRoomMsg = { type: t.JoinRoom, sender: "", payload: { roomName } }
    get().sendMessage(msg);
  },
  leaveRoom: () => {
    const msg: t.LeaveRoomMsg = { type: t.LeaveRoom }
    get().sendMessage(msg);
  },
  setVideoSignalHandler: handler => { vidSigHandler = handler },
}))


export const useWSConnect = () => { //helps remember disconnecting
  const { refresh } = useUserStore();
  const { connect, disconnect } = useWebSocket();

  useEffect(() => {
    (async () => {
      if (await refresh()) connect()
    })()

    return () => {
      disconnect();
    };
  }, [refresh, connect, disconnect]);
};