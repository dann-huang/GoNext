'use client';

import { useState, useReducer, useCallback, useEffect } from 'react';
import useWebSocket from '@/hooks/useWebsocket';
import useUserStore from '@/hooks/useUserStore';
import { VidSignalMsg } from '@/types/wsTypes';

interface Peer {
  conn: RTCPeerConnection;
  stream: MediaStream | null;
  username: string;
}

type PeerState = Map<string, Peer>;

type PeerAction =
  | { type: 'ADD_PEER'; payload: { username: string; conn: RTCPeerConnection } }
  | { type: 'REMOVE_PEER'; payload: { username: string } }
  | { type: 'SET_STREAM'; payload: { username: string; stream: MediaStream } }
  | { type: 'CLEAR_PEERS' };

const peerReducer = (state: PeerState, action: PeerAction): PeerState => {
  const newState = new Map(state);
  switch (action.type) {
    case 'ADD_PEER':
      newState.set(action.payload.username, { conn: action.payload.conn, stream: null, username: action.payload.username });
      return newState;
    case 'REMOVE_PEER':
      newState.get(action.payload.username)?.conn.close();
      newState.delete(action.payload.username);
      return newState;
    case 'SET_STREAM': {
      const peer = newState.get(action.payload.username);
      if (peer) peer.stream = action.payload.stream;
      return newState;
    }
    case 'CLEAR_PEERS':
      newState.forEach(peer => peer.conn.close());
      return new Map();
    default:
      return state;
  }
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function useGroupCall() {
  const sendSignal = useWebSocket(s => s.sendVidSignal);
  const setSignalHandler = useWebSocket(s => s.setVidSigHandler);
  const { username } = useUserStore();

  const [peers, dispatch] = useReducer(peerReducer, new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [inCall, setIsInCall] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const createPeer = useCallback((peerUsername: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ type: 'ice', target: peerUsername, candidate: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      dispatch({ type: 'SET_STREAM', payload: { username: peerUsername, stream: event.streams[0] } });
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    dispatch({ type: 'ADD_PEER', payload: { username: peerUsername, conn: pc } });
    return pc;
  }, [localStream, sendSignal]);

  const handleSignal = useCallback(async (msg: VidSignalMsg) => {
    const { sender, payload } = msg;
    if (sender === username) return;

    if (payload.target === '_all') {
      switch (payload.type) {
        case 'join':
          if (inCall) {
            console.log(`Peer ${sender} joined. Creating offer...`);
            const pc = createPeer(sender);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal({ type: 'offer', target: sender, offer });
          }
          break;
        case 'leave':
          dispatch({ type: 'REMOVE_PEER', payload: { username: sender } });
          break;
      }
      return;
    }

    if (payload.target === username) {
      switch (payload.type) {
        case 'offer':
          if (payload.offer) {
            console.log(`Received offer from ${sender}. Creating answer...`);
            const pc = createPeer(sender);
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal({ type: 'answer', target: sender, answer });
          }
          break;
        case 'answer':
          if (payload.answer) {
            console.log(`Received answer from ${sender}.`);
            const peer = peers.get(sender);
            if (peer) {
              await peer.conn.setRemoteDescription(new RTCSessionDescription(payload.answer));
            }
          }
          break;
        case 'ice':
          if (payload.candidate) {
            console.log(`Received ICE candidate from ${sender}.`);
            const peer = peers.get(sender);
            if (peer && peer.conn.remoteDescription) {
              try {
                await peer.conn.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } catch (err) {
                console.error('Error adding received ICE candidate', err);
              }
            }
          }
          break;
      }
    }
  }, [username, createPeer, sendSignal, inCall, peers]);

  useEffect(() => {
    if (inCall) {
      setSignalHandler(handleSignal);
    } else {
      setSignalHandler(null);
    }
    return () => setSignalHandler(null);
  }, [inCall, setSignalHandler, handleSignal]);

  const joinCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsInCall(true);
      setAudioOn(true);
      setVideoOn(true);
      sendSignal({ type: 'join', target: '_all' });
    } catch (err) {
      console.error('Error getting user media:', err);
    }
  };

  const leaveCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    dispatch({ type: 'CLEAR_PEERS' });
    setLocalStream(null);
    setIsInCall(false);
    sendSignal({ type: 'leave', target: '_all' });
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !audioOn;
      });
      setAudioOn(!audioOn);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoOn;
      });
      setVideoOn(!videoOn);
    }
  };

  const peerStreams = Array.from(peers.values())
    .filter(p => p.stream)
    .map(p => ({ username: p.username, stream: p.stream! }));

  return {
    localStream,
    peerStreams,
    inCall,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    audioOn,
    videoOn,
  };
}