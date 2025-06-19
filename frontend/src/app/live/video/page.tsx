'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { useGroupCall } from '@/hooks/useGroupCall';
import Button from '@/components/UI/Button';

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
    peerStreams,
    inCall,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    audioOn,
    videoOn,
  } = useGroupCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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
    return <div className="flex flex-col items-center justify-center h-full bg-background text-text p-4 text-center">
      <p className="text-lg font-medium mb-2">No Active Room</p>
      <p className="text-text/70 mb-6">Please join a room from chat window to start a video call</p>
      <Button
        onClick={() => window.open('/live', '_self')}
        color="primary"
      >
        Back to Live
      </Button>
    </div>;
  }

  // Calculate grid columns based on number of participants
  const totalParticipants = inCall ? 1 + peerStreams.length : 0;
  let gridCols = 'grid-cols-1';
  if (totalParticipants > 1) gridCols = 'grid-cols-2';
  if (totalParticipants > 4) gridCols = 'grid-cols-3';

  return <div className="flex flex-col h-screen w-full">
    <header className="w-full border-b border-primary p-4 flex justify-between">
      <div>
        <h1 className="text-xl font-semibold text-text truncate">Video Call</h1>
        <p className="text-sm text-text/70 truncate">Room: {currentRoom}</p>
      </div>

      <div className="flex gap-2">
        {inCall ? (
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
        {inCall && (
          <>
            <Button
              onClick={toggleAudio}
              color={audioOn ? 'primary' : 'secondary'}
              className="whitespace-nowrap flex-shrink-0 w-24"
            >
              {audioOn ? 'Mute' : 'Unmute'}
            </Button>
            <Button
              onClick={toggleVideo}
              color={videoOn ? 'primary' : 'secondary'}
              className="whitespace-nowrap flex-shrink-0 w-24"
            >
              {videoOn ? 'Blind' : 'Unblind'}
            </Button>
          </>
        )}
      </div>
    </header >

    {/* Scrollable content area */}
    < main className="flex-1 overflow-auto w-full" >
      <div className="w-full max-w-[2000px] mx-auto p-4">
        <div className={`grid ${gridCols} gap-4 w-full`}>
          {inCall && (
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

          {peerStreams.map(({ username, stream }) => {
            const videoRef = (el: HTMLVideoElement | null) => {
              if (el) el.srcObject = stream;
            };

            return <VideoContainer key={username} username={username}>
              <video
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                ref={videoRef}
              />
            </VideoContainer>;
          })}

          {!inCall && (
            <VideoContainer>
              <div className="absolute inset-0 flex items-center justify-center text-on-secondary">
                Click &quot;Join Call&quot; to start
              </div>
            </VideoContainer>
          )}
        </div>
      </div>
    </main >
  </div >;
} 