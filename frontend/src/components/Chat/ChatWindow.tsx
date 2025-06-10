'use client';

import React, { useState } from 'react';
import { useUserStore } from '@/hooks/userStore';
import LoginBox from './LoginBox';
import ChatBox from './ChatBox';

const ChatWindow: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const expire = useUserStore((state) => state.accessExp);
  const loggedIn = expire > Date.now()

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`
        fixed bottom-5 right-5 z-[1000]
        font-sans
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-[400px] h-[550px] rounded-lg' : 'w-16 h-16 rounded-full'}
        max-w-[calc(100vw-40px)] max-h-[calc(100vh-40px)]
      `}
    >
      {!isOpen && (
        <button
          onClick={toggleChat}
          aria-label="Open Chat"
          className="
            w-full h-full
            bg-primary text-background
            rounded-full shadow-lg
            flex items-center justify-center
            text-2xl font-bold
            cursor-pointer
            transition-all duration-300 ease-in-out
            hover:bg-accent hover:scale-105 active:scale-95
          "
        >
          💬
        </button>
      )}
      {isOpen && (
        <div
          className="
            w-full h-full
            bg-background border border-secondary
            rounded-lg shadow-2xl
            flex flex-col overflow-hidden
          "
        >
          <div className="bg-primary text-background p-3 flex justify-between items-center text-lg rounded-t-lg">
            <span>Chat</span>
            <button
              onClick={toggleChat}
              aria-label="Close Chat"
              className="text-background text-3xl leading-none px-1 cursor-pointer hover:text-accent"
            >
              &times;
            </button>
          </div>
          <div className="flex-grow">
            {loggedIn ? <ChatBox /> : <LoginBox />}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;