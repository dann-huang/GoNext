'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from './webSocket';
import { useUserStore } from './userStore';

interface PeerConnection {
  pc: RTCPeerConnection;
  stream: MediaStream;
}

interface PeerVideo {
  username: string;
  stream: MediaStream;
}

export function useGroupCall() {
  const { sendVidSignal, setVideoSignalHandler } = useWebSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [peerVideos, setPeerVideos] = useState<PeerVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Keep track of all peer connections by their username
  const peerConns = useRef<Map<string, PeerConnection>>(new Map());

  // Keep a ref to always have the latest local stream inside callbacks
  const localStreamRef = useRef<MediaStream | null>(null);

  // Create a new peer connection for a specific user
  const createPeerConnection = useCallback((targetUser: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
        // Add TURN servers here if needed
      ]
    });

    // Set up connection state change handler for debugging
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetUser}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.log(`Connection with ${targetUser} failed or disconnected`);
        // Remove peer from connections and videos
        peerConns.current.delete(targetUser);
        setPeerVideos(prev => prev.filter(p => p.username !== targetUser));
      }
    };

    // Log ICE gathering state changes
    pc.onicegatheringstatechange = () => {
      console.log(`ICE gathering state: ${pc.iceGatheringState}`);
    };

    // Log ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state: ${pc.iceConnectionState}`);
    };

    // Add local stream tracks to peer connection (if we already have them)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });
    }

    // Handle incoming remote stream
    const remoteStream = new MediaStream();
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
      // Update peer videos state
      setPeerVideos(prev => {
        const existing = prev.find(p => p.username === targetUser);
        if (existing) {
          return prev;
        }
        return [...prev, { username: targetUser, stream: remoteStream }];
      });
    };

    // Send ICE candidates through WebSocket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendVidSignal({
          type: 'ice-candidate',
          sender: useUserStore.getState().username,
          target: targetUser,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        // Remove peer from connections and videos
        peerConns.current.delete(targetUser);
        setPeerVideos(prev => prev.filter(p => p.username !== targetUser));
      }
    };

    peerConns.current.set(targetUser, { pc, stream: remoteStream });
    return pc;
  }, [localStreamRef, sendVidSignal]);

  // Initialize or clean up media devices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!localStream && isInCall) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream);
        })
        .catch(err => console.error('Error accessing media devices:', err));
    }

    const Conns = peerConns.current;
    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      // Close all peer connections
      Conns.forEach(({ pc }) => pc.close());
      Conns.clear();
      setPeerVideos([]);
    };
  }, [localStream, isInCall]);

  // Join the video call
  const joinCall = async () => {
    if (typeof window === 'undefined') return;

    try {
      setError(null);
      if (!localStreamRef.current) {
        console.log('Requesting media devices...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 },
          audio: true 
        });
        console.log('Got media stream:', stream.getTracks().map(t => ({
          kind: t.kind, 
          enabled: t.enabled, 
          readyState: t.readyState,
          muted: t.muted
        })));
        setLocalStream(stream);
        localStreamRef.current = stream;

        // Attach tracks to any peer connections that could have been created meanwhile
        peerConns.current.forEach(({ pc }) => {
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error accessing media devices:', error);
      setError(`Could not access camera/microphone: ${error.message}`);
      throw error;
    }

    // Now that we certainly have a stream, mark in-call and notify others
    setIsInCall(true);

    sendVidSignal({
      type: 'join-call',
      sender: useUserStore.getState().username,
    });
  };

  // Leave the video call
  const leaveCall = () => {
    setIsInCall(false);
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    peerConns.current.forEach(({ pc }) => pc.close());
    peerConns.current.clear();
    setPeerVideos([]);
  };

  // Toggle audio track (mute/unmute)
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
    setAudioEnabled(prev => !prev);
  };

  // Toggle video track (camera on/off)
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
    setVideoEnabled(prev => !prev);
  };

  // Handle incoming WebRTC signals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVidSignal = async (signal: unknown) => {
      if (!isValidSignal(signal)) return;
      const { type, sender, target } = signal;

      // Ignore our own messages
      if (target && target !== useUserStore.getState().username) return;

      try {
        switch (type) {
          case 'join-call': {
            console.debug('[useGroupCall] join-call received from', sender, 'isInCall', isInCall, 'haveStream', !!localStreamRef.current);
            if (!isInCall || !localStreamRef.current) return;
            
            // Someone wants to join, send them an offer
            const pc = createPeerConnection(sender);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.debug('[useGroupCall] sending offer to', sender, 'sdp size', offer.sdp?.length);
            
            sendVidSignal({
              type: 'offer',
              sender: useUserStore.getState().username,
              target: sender,
              offer
            });
            break;
          }

          case 'offer': {
            console.debug('[useGroupCall] offer received from', sender, 'haveConn', peerConns.current.has(sender));
            if (!signal.offer) return;
            // We received an offer, create answer
            const pc = createPeerConnection(sender);
            await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.debug('[useGroupCall] sending answer to', sender);
            
            sendVidSignal({
              type: 'answer',
              sender: useUserStore.getState().username,
              target: sender,
              answer
            });
            break;
          }

          case 'answer': {
            console.debug('[useGroupCall] answer received from', sender);
            if (!signal.answer) return;
            const senderConn = peerConns.current.get(sender);
            if (senderConn) {
              const pc = senderConn.pc;
              if (!pc.currentRemoteDescription) {
                try {
                  await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
                } catch (err) {
                  console.error('Failed to apply remote answer from', sender, err);
                }
              } else {
                console.debug(`Remote description already set for ${sender}, skipping duplicate answer`);
              }
            }
            break;
          }

          case 'ice-candidate': {
            console.debug('[useGroupCall] ice-candidate from', sender);
            if (!signal.candidate) return;
            const senderConn = peerConns.current.get(sender);
            if (senderConn) {
              await senderConn.pc.addIceCandidate(
                new RTCIceCandidate(signal.candidate)
              );
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error handling signal:', err);
      }
    };

    setVideoSignalHandler(handleVidSignal);
    
    return () => {
      setVideoSignalHandler(() => {});
    };
  }, [setVideoSignalHandler, sendVidSignal, isInCall, localStreamRef, createPeerConnection]);

  return {
    localStream,
    peerVideos,
    isInCall,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    audioEnabled,
    videoEnabled,
    error
  };
}

// Type guard for signal validation
function isValidSignal(signal: unknown): signal is {
  type: 'join-call' | 'offer' | 'answer' | 'ice-candidate';
  sender: string;
  target?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
} {
  if (!signal || typeof signal !== 'object') return false;
  const s = signal as Record<string, unknown>;
  return (
    typeof s.type === 'string' &&
    ['join-call', 'offer', 'answer', 'ice-candidate'].includes(s.type) &&
    typeof s.sender === 'string' &&
    (!s.target || typeof s.target === 'string')
  );
} 