'use client';

import { useWebSocket } from '@/hooks/webSocket';

export default function LiveLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { currentRoom } = useWebSocket();

  if (!currentRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background text-text">
        <p className="text-lg mb-4">Please connect to a chat channel first</p>
        <p className="text-sm text-text/60">Join a room in the chat to start a live session</p>
      </div>
    );
  }

  return <>{children}</>;
} 