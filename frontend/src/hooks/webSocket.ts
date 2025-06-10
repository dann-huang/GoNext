"use client";

import { useEffect } from 'react';
import { useUserStore } from './userStore';
import * as t from '@/types/wsTypes';
import { create } from 'zustand';
import { RECONNECT_MAX_DELAY, RECONNECT_INITIAL_DELAY, RECONNECT_MAX_ATTEMPTS, WS_URL } from '@/config/consts';

interface WSState {
  error: string;
  currentRoom: string;

  msgLog: t.IncomingMsg[];
  clients: string[];

  gameStates: t.IncomingGameState[];

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
        console.debug('recieved', msg)

        //todo: lots
        switch (msg.Type) {
          case t.msgChat:
          case t.msgStatus:
          case t.msgError:
            set(state => ({ msgLog: [...state.msgLog, msg] }));
            break;
          case t.msgVidSignal:
            if (vidSigHandler === null) {
              console.warn("WS recieved vid signal, but no handler")
            } else {
              vidSigHandler(msg.Payload)
            }
            break;
          case t.msgGameState:
            set(state => ({ gameStates: [...state.gameStates, msg] }));
            break;
          case t.msgJoinRoom:
            set(state => ({ msgLog: [...state.msgLog, msg], currentRoom: msg.Payload.roomName }));
            break;
          case t.msgGetClients:
            set(state => ({
              msgLog: [...state.msgLog, msg],
              clients: msg.Payload.clients,
              currentRoom: msg.Payload.roomName
            }))
            break;
          default:
            console.warn('Unknown message type received:', msg);
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
      console.log('WS closed:', event.code, event.reason);
      set({ error: `WS disconnected: code ${event.code}, reason: ${event.reason || 'Unknown'}.` });

      if (event.code === 1000 || event.code === 1001)
        return console.log("WS closed gracefully");

      const loggedIn = await useUserStore.getState().refresh();
      if (!loggedIn) return console.error("WS died; require auth to reconnect");

      if (++reconnAttempt > RECONNECT_MAX_ATTEMPTS)
        return console.log("WS died; reconnect unsuccessful");

      reconnDelay = Math.min(reconnDelay * 2, RECONNECT_MAX_DELAY);
      console.log(`WS reconnect in ${reconnDelay / 1000}s...`);
      reconnTimeout = setTimeout(get().connect, reconnDelay);
    }
  },
  disconnect: () => {
    if (reconnTimeout) {
      clearTimeout(reconnTimeout);
      reconnTimeout = null;
    }

    if (ws) {
      console.log("Closing WS");
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
  sendChat: (text: string) => {
    const displayName = useUserStore.getState().displayName;
    const msg: t.OutgoingChat = {
      Type: t.msgChat,
      Payload: { text, displayName }
    }
    get().sendMessage(msg);
  },
  joinRoom: (roomName: string) => {
    const msg: t.OutgoingJoinRoom = { Type: t.msgJoinRoom, Payload: { roomName } }
    get().sendMessage(msg);
  },
  leaveRoom: () => {
    const msg: t.OutgoingLeaveRoom = { Type: t.msgLeaveRoom }
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