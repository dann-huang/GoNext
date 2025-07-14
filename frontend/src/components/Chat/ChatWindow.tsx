'use client';

import { useState } from 'react';
import useUserStore from '@/hooks/useUserStore';
import { useWSConnect } from '@/hooks/useWebsocket';
import LoginBox from '../Login/LoginBox';
import ChatBox from './ChatBox';
import Button from '../UI/Button';
import { MessageCircleMore, X } from 'lucide-react';

export default function ChatWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const expire = useUserStore(state => state.accessExp);
  const loggedIn = expire > Date.now();
  useWSConnect();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`
        fixed bottom-5 right-5 z-[1000] font-sans
        transition-all duration-300 ease-in-out
        ${
          isOpen
            ? 'w-[400px] h-[600px]'
            : 'w-[50px] h-[50px]'
        }
        max-w-[calc(100vw-40px)] max-h-[calc(100vh-40px)]
      `}
    >
      {isOpen ? (
        <div className="w-full h-full rounded-lg border border-accent bg-surface">
          <Button
            variant="secondary"
            size="sm"
            className="absolute -top-3 -right-3 p-2 rounded-full h-10 w-10"
            onClick={toggleChat}
          >
            <X />
          </Button>
          <div className="w-full h-full rounded-lg overflow-hidden">
            {loggedIn ? <ChatBox /> : <LoginBox />}
          </div>
        </div>
      ) : (
        <Button
          onClick={toggleChat}
          variant="secondary"
          aria-label="Open Chat"
          className="w-full h-full text-2xl rounded-full"
        >
          <MessageCircleMore />
        </Button>
      )}
    </div>
  );
}
