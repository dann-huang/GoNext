'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { useUserStore } from '@/hooks/userStore';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function ChatBox() {
  const [message, setMessage] = useState('');
  const { msgLog, currentRoom, sendChat, connect, disconnect } = useWebSocket(); //todo: take error from here and display
  const username = useUserStore((state) => state.username);

  const expire = useUserStore((state) => state.accessExp);
  const loggedIn = expire > Date.now();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    //todo: only scroll if user isn't reading higher up
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgLog]);

  useEffect(() => {
    if (loggedIn) {
      connect()
    }
    return disconnect;
  }, [loggedIn, connect, disconnect]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendChat(message.trim());
      setMessage('');
    }
  };

  return <div className="flex flex-col h-full bg-background">
    <div className="p-3 bg-primary text-on-primary border-b border-secondary">
      <p className="text-sm font-semibold">Room: {currentRoom || 'N/A'}</p>
    </div>

    <div className="flex-grow overflow-y-auto p-4 space-y-2 scrollbar">
      {msgLog.length === 0
        ? <p className="text-center text-text text-sm">No messages yet.</p>
        : msgLog.map((msg, index) => {
          const isServerMessage = msg.sender === "_server";
          const isMyMessage = msg.sender === username;
          return <div
            key={index}
            className={`flex ${isServerMessage ? 'justify-center'
              : isMyMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] p-3 rounded-xl text-base break-words shadow-sm
              ${isServerMessage ? 'bg-accent text-on-accent text-center italic text-sm'
                : isMyMessage
                  ? 'bg-primary text-on-primary rounded-br-none'
                  : 'bg-secondary text-on-secondary rounded-bl-none'
              }`}>
              {!isServerMessage &&
                <span className="font-semibold block text-xs mb-1 opacity-80">
                  {msg.sender}
                </span>
              }
              {msg.payload.message}
            </div>
          </div>;
        })}
      <div ref={messagesEndRef} />
    </div>

    <form onSubmit={handleSendMessage} className="p-3 border-t border-secondary bg-background flex">
      <Input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-grow"
        rounded='rounded-l-md'
      />
      <Button
        type="submit"
        rounded="rounded-r-md"
      >
        Send
      </Button>
    </form>
  </div >;
};