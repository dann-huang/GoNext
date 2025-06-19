'use client';

import { useState } from 'react';
import { useUserStore } from '@/hooks/userStore';
import { useWSConnect } from '@/hooks/webSocket';
import LoginBox from './LoginBox';
import ChatBox from './ChatBox';
import Button from '../UI/Button';

export default function ChatWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const expire = useUserStore((state) => state.accessExp);
  const loggedIn = expire > Date.now();
  useWSConnect();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return <div
    className={`
        fixed bottom-5 right-5 z-[1000] font-sans
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-[400px] h-[600px] rounded-lg' : 'w-[64px] h-[64px] rounded-full'}
        max-w-[calc(100vw-40px)] max-h-[calc(100vh-40px)]
      `}
  >
    {!isOpen && (
      <Button
        onClick={toggleChat}
        variant='accent'
        aria-label="Open Chat"
        className="w-full h-full text-2xl rounded-full"
      >
        💬
      </Button>
    )}
    {isOpen && (
      <div
        className="w-full h-full border border-secondary rounded-lg shadow-2xl relative"
      >
        <Button
          variant="secondary"
          size="sm"
          className="absolute -top-3 -right-3 p-2 rounded-full"
          onClick={toggleChat}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </Button>
        <div className="w-full h-full rounded-lg overflow-hidden">
          {loggedIn ? <ChatBox /> : <LoginBox />}
        </div>
      </div>
    )}
  </div>;
};