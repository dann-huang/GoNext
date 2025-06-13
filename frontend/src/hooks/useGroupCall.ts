'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { useUserStore } from '@/hooks/userStore';
import { VidSignalMsg } from '@/types/wsTypes';

interface PeerVideo {
  username: string;
  stream: MediaStream;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useGroupCall() {
  const getClients = useWebSocket(s => s.getClients);
  const sendVidSignal = useWebSocket(s => s.sendVidSignal);
  const setVideoSignalHandler = useWebSocket(s => s.setVideoSignalHandler);
  const { username: username } = useUserStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerVideos, setPeerVideos] = useState<PeerVideo[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  const createPeerConnection = useCallback((peerUsername: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendVidSignal({
          type: 'ice',
          target: peerUsername,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      setPeerVideos((prev) => {
        if (prev.some((p) => p.username === peerUsername)) return prev;
        return [...prev, { username: peerUsername, stream: event.streams[0] }];
      });
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    peerConnections.current.set(peerUsername, pc);
    return pc;
  }, [localStream, sendVidSignal]);


  const handleVideoSignal = useCallback(async (msg: VidSignalMsg) => {
    const { sender, payload } = msg;
    if (payload.target !== username) return;

    switch (payload.type) {
      case 'leave': {
        const pc = peerConnections.current.get(sender);
        if (pc) {
          pc.close();
          peerConnections.current.delete(sender);
        }
        setPeerVideos(prev => prev.filter(p => p.username !== sender));
        break;
      }
      case 'join': {
        console.log(`Peer ${sender} joined. Creating offer...`);
        const pc = createPeerConnection(sender);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendVidSignal({ type: 'offer', target: sender, offer });
        break;
      }

      case 'offer': {
        if (payload.offer) {
          console.log(`Received offer from ${sender}. Creating answer...`);
          const pc = createPeerConnection(sender);
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendVidSignal({ type: 'answer', target: sender, answer });
        }
        break;
      }

      case 'answer': {
        if (payload.answer) {
          console.log(`Received answer from ${sender}.`);
          const pc = peerConnections.current.get(sender);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          }
        }
        break;
      }

      case 'ice': {
        if (payload.candidate) {
          console.log(`Received ICE candidate from ${sender}.`);
          const pc = peerConnections.current.get(sender);
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (err) {
              console.error('Error adding received ICE candidate', err);
            }
          }
        }
        break;
      }
    }
  }, [username, createPeerConnection, sendVidSignal]);

  useEffect(() => {
    if (isInCall)
      setVideoSignalHandler(handleVideoSignal);
    else
      setVideoSignalHandler(_ => { });

    return () => {
      setVideoSignalHandler(_ => { });
    };
  }, [isInCall, setVideoSignalHandler, handleVideoSignal]);

  const joinCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      setAudioEnabled(true);
      setVideoEnabled(true);
      setLocalStream(stream);
      setIsInCall(true);

      getClients().forEach(client => {
        if (client !== username)
          sendVidSignal({ type: 'join', target: client });
      });
    } catch (err) {
      console.error('Error getting user media:', err);
    }
  };

  const leaveCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    setLocalStream(null);
    setPeerVideos([]);
    setIsInCall(false);
    getClients().forEach(client => {
      if (client !== username)
        sendVidSignal({ type: 'leave', target: client });
    });
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

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
  };
}