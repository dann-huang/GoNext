'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/webSocket';
import { useUserStore } from '@/hooks/userStore';
import Input from '../UI/Input';
import Button from '../UI/Button';

export default function ChatBox() {
  const [message, setMessage] = useState('');
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const { msgLog, currentRoom, joinRoom, sendChat } = useWebSocket();
  const username = useUserStore((state) => state.username);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    //todo: only scroll if user isn't reading higher up
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgLog]);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      sendChat(message.trim());
      setMessage('');
    }
  };

  return <div className="flex flex-col h-full bg-background">
    <div className="px-3 py-2 bg-primary text-on-primary border-b border-secondary">
      {showRoomInput ? (
        <form onSubmit={e => {
          e.preventDefault();
          if (newRoom.trim()) {
            joinRoom(newRoom.trim());
            setNewRoom('');
            setShowRoomInput(false);
          }
        }} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter room name..."
            value={newRoom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoom(e.target.value)}
            className="flex-grow text-sm"
            autoFocus
          />
          <Button
            type="submit"
          >
            Join
          </Button>
          <Button
            type="button"
            color="secondary"
            onClick={() => setShowRoomInput(false)}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <div 
          className="flex p-2 items-center gap-2 cursor-pointer hover:opacity-80"
          onClick={() => setShowRoomInput(true)}
        >
          <p className="text-sm font-semibold">Room: {currentRoom || 'N/A'}</p>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      )}
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
        className="flex-grow rounded-r-none"
      />
      <Button
        type="submit"
        className="rounded-l-none border-secondary"
      >
        Send
      </Button>
    </form>
  </div >;
};