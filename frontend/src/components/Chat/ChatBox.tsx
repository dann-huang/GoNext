'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { useUserStore } from '@/hooks/userStore';

const ChatView: React.FC = () => {
  const [message, setMessage] = useState('');
  const msgLog = useWebSocket((state) => state.msgLog);
  const sendChat = useWebSocket((state) => state.sendChat);
  const currentRoom = useWebSocket((state) => state.currentRoom);
  const clients = useWebSocket((state) => state.clients);
  const username = useUserStore((state) => state.username);

  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref to scroll to bottom

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom(); // Scroll to bottom on new messages
  }, [msgLog]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendChat(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-text">
      {/* Chat Info Header */}
      <div className="p-3 bg-secondary text-text border-b border-secondary">
        <p className="text-sm font-semibold">Room: {currentRoom || 'N/A'}</p>
        <p className="text-xs">Clients: {clients.length}</p>
      </div>

      {/* Message Log */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {msgLog.length === 0 ? (
          <p className="text-center text-secondary text-sm">No messages yet.</p>
        ) : (
          msgLog.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`
                  max-w-[75%] p-2 rounded-lg text-sm break-words
                  ${msg.sender === username
                    ? 'bg-primary text-background rounded-br-none'
                    : 'bg-secondary text-text rounded-bl-none'
                  }
                `}
              >
                <span className="font-semibold block text-xs mb-1 opacity-80">{msg.sender}</span>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} /> {/* Dummy div for scrolling */}
      </div>

      {/* Message Input */}
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
          className="bg-primary text-background py-2 px-4 rounded-r-md font-semibold hover:bg-accent transition-colors duration-200"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatView;