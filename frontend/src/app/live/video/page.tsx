'use client';

import React, { useRef } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import Button from '@/components/ui/Button';
import { useGroupCall } from '@/hooks/useGroupCall';

export default function VideoPage() {
  const { currentRoom } = useWebSocket();
  const { localStream, peerVideos, isInCall, joinCall, leaveCall } = useGroupCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Set local video stream when it's available
  if (localStream && localVideoRef.current) {
    localVideoRef.current.srcObject = localStream;
  }

  if (!currentRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background text-text">
        <p className="text-lg mb-4">Please connect to a chat channel first</p>
        <p className="text-sm text-text/60">Join a room in the chat to start a video call</p>
      </div>
    );
  }

  // Calculate grid columns based on number of participants
  const totalParticipants = isInCall ? 1 + peerVideos.length : 0;
  let gridCols = 'grid-cols-1';
  if (totalParticipants > 1) gridCols = 'grid-cols-2';
  if (totalParticipants > 4) gridCols = 'grid-cols-3';

  return <>
    <div className="flex justify-between items-center">
      <h1 className="text-xl font-semibold text-text">Video Call - Room: {currentRoom}</h1>
      <div className="flex gap-2">
        <Button
          onClick={isInCall ? leaveCall : joinCall}
          color={isInCall ? 'secondary' : 'primary'}
        >
          {isInCall ? 'Leave Call' : 'Join Call'}
        </Button>
      </div>
    </div>

    <div className="flex-grow">
      <div className={`grid ${gridCols} gap-4`}>
        {/* Local video */}
        {isInCall && (
          <div className="relative bg-secondary rounded-lg overflow-hidden">
            <div className="w-full pt-[56.25%] relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 text-sm text-on-secondary bg-secondary/80 px-2 py-1 rounded">
                You
              </div>
            </div>
          </div>
        )}

        {/* Remote videos */}
        {peerVideos.map(({ username, stream }) => (
          <div key={username} className="relative bg-secondary rounded-lg overflow-hidden">
            <div className="w-full pt-[56.25%] relative">
              <video
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                ref={el => {
                  if (el) el.srcObject = stream;
                }}
              />
              <div className="absolute bottom-2 left-2 text-sm text-on-secondary bg-secondary/80 px-2 py-1 rounded">
                {username}
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder for empty state */}
        {!isInCall && (
          <div className="relative bg-secondary rounded-lg overflow-hidden">
            <div className="w-full pt-[56.25%] relative">
              <div className="absolute inset-0 flex items-center justify-center text-text/50">
                Click "Join Call" to start
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </>;
} 