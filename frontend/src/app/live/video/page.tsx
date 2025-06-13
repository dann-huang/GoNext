'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { useGroupCall } from '@/hooks/useGroupCall';
import Button from '@/components/ui/Button';

function VideoContainer({ children, username }: { children: React.ReactNode; username?: string }) {
  return <div className="relative bg-secondary rounded-lg overflow-hidden w-full pt-[56.25%] relative">
    {children}
    {username && (
      <div className="absolute bottom-2 left-2 text-sm text-on-secondary bg-secondary/50 px-2 py-1 rounded">
        {username}
      </div>
    )}
  </div>;
}

export default function VideoPage() {
  const { currentRoom } = useWebSocket();
  const {
    localStream,
    peerVideos,
    isInCall,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    audioEnabled,
    videoEnabled,
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
        <p className="text-text/70 mb-6">Please join a room from chat window to start a video call</p>
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

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Fixed header */}
      <header className="w-full border-b border-border p-4 flex justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text truncate">Video Call</h1>
          <p className="text-sm text-text/70 truncate">Room: {currentRoom}</p>
        </div>

        <div className="flex gap-2">
          {isInCall ? (
            <Button
              onClick={leaveCall}
              color="primary"
              className="whitespace-nowrap flex-shrink-0 w-24"
            >
              Leave Call
            </Button>
          ) : (
            <Button
              onClick={handleJoinCall}
              color="primary"
              disabled={isJoining}
              className="whitespace-nowrap flex-shrink-0 w-24"
            >
              {isJoining ? 'Joining...' : 'Join Call'}
            </Button>
          )}
          {isInCall && (
            <>
              <Button
                onClick={toggleAudio}
                color={audioEnabled ? 'primary' : 'secondary'}
                className="whitespace-nowrap flex-shrink-0 w-24"
              >
                {audioEnabled ? 'Mute' : 'Unmute'}
              </Button>
              <Button
                onClick={toggleVideo}
                color={videoEnabled ? 'primary' : 'secondary'}
                className="whitespace-nowrap flex-shrink-0 w-24"
              >
                {videoEnabled ? 'Hide Cam' : 'Show Cam'}
              </Button>
            </>
          )}
        </div>

        {callError && (
          <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-medium">Error</p>
            <p>{callError}</p>
          </div>
        )}
      </header >

      {/* Scrollable content area */}
      < main className="flex-1 overflow-auto w-full" >
        <div className="w-full max-w-[2000px] mx-auto p-4">
          <div className={`grid ${gridCols} gap-4 w-full`}>
            {isInCall && (
              <VideoContainer username="You">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </VideoContainer>
            )}

            {peerVideos.map(({ username, stream }) => {
              const videoRef = (el: HTMLVideoElement | null) => {
                el && (el.srcObject = stream);
              };

              return (
                <VideoContainer key={username} username={username}>
                  <video
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    ref={videoRef}
                  />
                </VideoContainer>
              );
            })}

            {!isInCall && (
              <VideoContainer>
                <div className="absolute inset-0 flex items-center justify-center text-on-secondary">
                  Click &quot;Join Call&quot; to start
                </div>
              </VideoContainer>
            )}
          </div>
        </div>
      </main >
    </div >
  );
} 