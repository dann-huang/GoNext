import { useState, useEffect, useRef } from 'react';
import useWebSocket from '@/hooks/useWebsocket';
import useUserStore from '@/hooks/useUserStore';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { msgError } from '@/types/wsTypes';
import { SquarePen, LogOut, DoorOpen } from 'lucide-react';

export default function ChatBox() {
  const [message, setMessage] = useState('');
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const { msgLog, currentRoom, joinRoom, leaveRoom, sendChat, clients } =
    useWebSocket();
  const { username } = useUserStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    useUserStore.getState().logout();
  };

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

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-3 py-2 bg-primary text-on-primary border-b border-secondary">
        {showRoomInput ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (newRoom.trim()) {
                joinRoom(newRoom.trim());
                setNewRoom('');
                setShowRoomInput(false);
              }
            }}
            className="flex gap-2"
          >
            <Input
              type="text"
              placeholder="Enter room name..."
              value={newRoom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewRoom(e.target.value)
              }
              className="flex-grow text-sm"
              autoFocus
            />
            <Button type="submit">Join</Button>
            <Button
              type="button"
              color="secondary"
              onClick={() => setShowRoomInput(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <div className="flex justify-between items-center w-full">
            <div
              className="flex p-2 items-center gap-2 cursor-pointer hover:opacity-80"
              onClick={() => setShowRoomInput(true)}
            >
              #{currentRoom}
              <SquarePen className="w-4 h-4" />
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                leaveRoom();
              }}
              className="p-2 text-secondary hover:bg-secondary/50 hover:text-on-secondary rounded-md transition-colors"
              title="Leave Room"
            >
              <DoorOpen className="inline-block w-4 h-4" />
              <span> Leave</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-error hover:bg-error/50 hover:text-on-error rounded-md transition-colors"
              title="Log out"
            >
              <LogOut size={16} className="inline-block" />
              <span> Logout</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-2 scrollbar">
        {msgLog.length === 0 ? (
          <p className="text-center text-text text-sm">No messages yet.</p>
        ) : (
          msgLog.map((msg, index) => {
            const isServerMessage = msg.sender === '_server';
            const isMyMessage = msg.sender === username;
            return (
              <div
                key={index}
                className={`flex ${
                  isServerMessage
                    ? 'justify-center'
                    : isMyMessage
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-xl text-base break-words shadow-sm
              ${
                isServerMessage
                  ? msg.type == msgError
                    ? 'bg-error text-on-error, text-center italic text-sm'
                    : 'bg-accent text-on-accent text-center italic text-sm'
                  : isMyMessage
                  ? 'bg-primary text-on-primary rounded-br-none'
                  : 'bg-secondary text-on-secondary rounded-bl-none'
              }`}
                >
                  {!isServerMessage && (
                    <span className="font-semibold block text-xs mb-1 opacity-80">
                      {clients[msg.sender] || '_' + msg.sender}
                    </span>
                  )}
                  {msg.payload.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-secondary bg-background flex"
      >
        <Input
          type="text"
          placeholder="Compose message here..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="flex-grow rounded-r-none"
        />
        <Button type="submit" className="rounded-l-none border-secondary">
          Send
        </Button>
      </form>
    </div>
  );
}
