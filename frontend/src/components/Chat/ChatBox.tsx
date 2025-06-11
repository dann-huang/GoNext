'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { useUserStore } from '@/hooks/userStore';

export default function ChatBox() {
  const [message, setMessage] = useState('');
  const { msgLog, currentRoom, clients, sendChat, connect, disconnect } = useWebSocket(); //todo: take error from here and display
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

  console.log(msgLog)
  return (
    <div className="flex flex-col h-full bg-background text-text">
      <div className="p-3 bg-primary text-text border-b border-secondary">
        <p className="text-sm font-semibold">Room: {currentRoom || 'N/A'}</p>
        <p className="text-xs">Clients: {clients.length}</p>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-2 scrollbar">
        {msgLog.length === 0 ? (
          <p className="text-center text-secondary text-sm">No messages yet.</p>
        ) : (
          msgLog.map((msg, index) => <div key={index} className={`flex ${msg.sender === "_server" ? 'justify-center'
            : msg.sender === username ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`
                  max-w-[75%] p-2 rounded-lg text-sm break-words justify
                  ${msg.sender === username
                  ? 'bg-primary text-background rounded-br-none'
                  : 'bg-secondary text-text rounded-bl-none'
                }
                `}
            >
              <span className="font-semibold block text-xs mb-1 opacity-80">{msg.sender}</span>
              {msg.payload.message}
            </div>
          </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-secondary bg-background flex">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow p-2 border border-secondary rounded-l-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="bg-primary text-background py-2 px-4 rounded-r-md font-semibold hover:bg-accent transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};