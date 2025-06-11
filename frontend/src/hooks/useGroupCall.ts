'use client';

import { useEffect, useRef, useState } from 'react';
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
  
  // Keep track of all peer connections by their username
  const peerConnections = useRef<Map<string, PeerConnection>>(new Map());

  // Initialize or clean up media devices
  useEffect(() => {
    if (!localStream && isInCall) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream);
        })
        .catch(err => console.error('Error accessing media devices:', err));
    }

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      // Close all peer connections
      peerConnections.current.forEach(({ pc }) => pc.close());
      peerConnections.current.clear();
      setPeerVideos([]);
    };
  }, [localStream, isInCall]);

  // Create a new peer connection for a specific user
  const createPeerConnection = (targetUser: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add local stream tracks to peer connection
    localStream?.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

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
          target: targetUser,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        // Remove peer from connections and videos
        peerConnections.current.delete(targetUser);
        setPeerVideos(prev => prev.filter(p => p.username !== targetUser));
      }
    };

    peerConnections.current.set(targetUser, { pc, stream: remoteStream });
    return pc;
  };

  // Join the video call
  const joinCall = async () => {
    if (!localStream) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
    }
    setIsInCall(true);

    // Send join signal to everyone in the room
    sendVidSignal({
      type: 'join-call'
    });
  };

  // Leave the video call
  const leaveCall = () => {
    setIsInCall(false);
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    peerConnections.current.forEach(({ pc }) => pc.close());
    peerConnections.current.clear();
    setPeerVideos([]);
  };

  // Handle incoming WebRTC signals
  useEffect(() => {
    const handleVidSignal = async (signal: any) => {
      const { type, sender, target } = signal;

      // Ignore our own messages
      if (target && target !== useUserStore.getState().username) return;

      try {
        switch (type) {
          case 'join-call': {
            if (!isInCall || !localStream) return;
            
            // Someone wants to join, send them an offer
            const pc = createPeerConnection(sender);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            sendVidSignal({
              type: 'offer',
              target: sender,
              offer
            });
            break;
          }

          case 'offer': {
            // We received an offer, create answer
            const pc = createPeerConnection(sender);
            await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            sendVidSignal({
              type: 'answer',
              target: sender,
              answer
            });
            break;
          }

          case 'answer': {
            const peerConn = peerConnections.current.get(sender);
            if (peerConn) {
              await peerConn.pc.setRemoteDescription(
                new RTCSessionDescription(signal.answer)
              );
            }
            break;
          }

          case 'ice-candidate': {
            const peerConn = peerConnections.current.get(sender);
            if (peerConn) {
              await peerConn.pc.addIceCandidate(
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
  }, [setVideoSignalHandler, sendVidSignal, isInCall, localStream]);

  return {
    localStream,
    peerVideos,
    isInCall,
    joinCall,
    leaveCall
  };
} 