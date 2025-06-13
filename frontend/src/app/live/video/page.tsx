'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { useGroupCall } from '@/hooks/useGroupCall';
import Button from '@/components/ui/Button';

export default function VideoPage() {
  const { currentRoom } = useWebSocket();
  const { 
    localStream, 
    peerVideos, 
    isInCall, 
    joinCall, 
    leaveCall, 
    error: callError 
  } = useGroupCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Set local video stream when it's available
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  const handleJoinCall = async () => {
    try {
      setIsJoining(true);
      await joinCall();
    } catch (err) {
      console.error('Failed to join call:', err);
    } finally {
      setIsJoining(false);
    }
  };

  if (!currentRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background text-text p-4 text-center">
        <p className="text-lg font-medium mb-2">No Active Room</p>
        <p className="text-text/70 mb-6">Please join a room from the chat to start a video call</p>
        <Button 
          onClick={() => window.open('/live', '_self')}
          color="primary"
        >
          Back to Live
        </Button>
      </div>
    );
  }

  // Calculate grid columns based on number of participants
  const totalParticipants = isInCall ? 1 + peerVideos.length : 0;
  let gridCols = 'grid-cols-1';
  if (totalParticipants > 1) gridCols = 'grid-cols-2';
  if (totalParticipants > 4) gridCols = 'grid-cols-3';

  return <>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Video Call</h1>
        <p className="text-sm text-text/70">Room: {currentRoom}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {isInCall ? (
          <Button
            onClick={leaveCall}
            color="secondary"
            className="w-full sm:w-auto"
          >
            Leave Call
          </Button>
        ) : (
          <Button
            onClick={handleJoinCall}
            color="primary"
            disabled={isJoining}
            className="w-full sm:w-auto"
          >
            {isJoining ? 'Joining...' : 'Join Call'}
          </Button>
        )}
      </div>
    </div>
    
    {callError && (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
        <p className="font-medium">Error</p>
        <p>{callError}</p>
      </div>
    )}

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
                Click &quot;Join Call&quot; to start
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </>;
} 