'use client';

import React, { useState } from 'react';
import { useUserStore } from '@/hooks/userStore';
import LoginBox from './LoginBox';
import ChatBox from './ChatBox';

export default function ChatWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const expire = useUserStore((state) => state.accessExp);
  const loggedIn = expire > Date.now();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`
        fixed bottom-5 right-5 z-[1000] font-sans
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-[600px] h-[800px] rounded-lg' : 'w-[64px] h-[64px] rounded-full'}
        max-w-[calc(100vw-40px)] max-h-[calc(100vh-40px)]
      `}
    >
      {!isOpen && (
        <button
          onClick={toggleChat}
          aria-label="Open Chat"
          className="
            w-full h-full bg-primary text-background rounded-full shadow-lg
            flex items-center justify-center text-2xl font-bold cursor-pointer
            hover:bg-accent hover:scale-105 active:scale-95
          "
        >
          💬
        </button>
      )}
      {isOpen && (
        <div
          className="
            w-full h-full bg-background border border-secondary rounded-lg
            shadow-2xl flex flex-col relative
          "
        >
          <button className="absolute -top-3 -right-3 bg-secondary hover:bg-accent shadow-lg
            hover:scale-105 text-white rounded-full p-2 transition-colors transform "
            onClick={toggleChat}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          <div className="flex-grow">
            {loggedIn ? <ChatBox /> : <LoginBox />}
          </div>
        </div>
      )}
    </div>
  );
};