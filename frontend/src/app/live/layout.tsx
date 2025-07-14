'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatIndicator from '@/components/UI/ChatIndicator';
import useWebSocket from '@/hooks/useWebsocket';

export default function LiveLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { currentRoom } = useWebSocket();
  const prevRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prevRoomRef.current) {
      prevRoomRef.current = currentRoom;
      return;
    }
    if (prevRoomRef.current !== currentRoom) {
      router.push('/live');
      prevRoomRef.current = currentRoom;
    }
  }, [currentRoom, router]);


  if (!currentRoom) {
    return <div className='w-full flex flex-col items-center justify-center '>
      <h1 className='text-2xl font-bold mb-4'>Hold on!</h1>
      <p className='text-lg mb-6 max-w-md text-center'>
        These pages are only accessible while logged in; we need a name to display after all.
        Use the bottom right button to connect~
      </p>

      <ChatIndicator />
    </div>;
  }

  return <>{children}</>;
}