'use client';

import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '@/hooks/themeStore';
import { motion, AnimatePresence } from 'framer-motion';

interface UserReq {
  username: string;
  password: string;
}

export default function Chatroom() {
  const { getTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom() }, [chatMessages, isOpen]);

  const handleAuth = async (endpoint: 'login' | 'register') => {
    setAuthMessage(''); // Clear previous messages
    if (!username || !password) {
      setAuthMessage('Username and password are required.');
      return;
    }

    // Hash password before sending (client-side hashing is for security best practices,
    // though your Go backend will also validate/hash. Adjust as needed).
    // For simplicity here, we're just sending the plain password as your Go struct suggests.
    // In a real app, you'd likely hash client-side before sending, or ensure TLS for plain text.
    // Given your Go backend expects 'password' directly, we'll send it as is for this example.
    const userReq: Omit<UserReq, 'password_hash'> & { password: string } = {
      username: username,
      password: password,
    };

    try {
      // Adjust URL based on your Next.js dev/prod environment
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userReq),
      });

      if (res.ok) {
        const data = await res.json();
        setAuthMessage(`${endpoint} successful! ${data.message || ''}`);
        setIsLoggedIn(true);
        // In a real app, you'd store tokens here (e.g., in localStorage, http-only cookies)
      } else {
        const errorData = await res.json();
        setAuthMessage(`Error ${endpoint}: ${errorData.error || res.statusText}`);
        setIsLoggedIn(false);
      }
    } catch (error) {
      setAuthMessage(`Network error during ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoggedIn(false);
    }
  };

  const handleSendMessage = () => {
    if (currentMessage.trim() && isLoggedIn) {
      const timestamp = new Date().toLocaleTimeString();
      setChatMessages(prev => [...prev, `${timestamp} - You: ${currentMessage.trim()}`]);
      setCurrentMessage('');
    }
  };

  const currentThemeClass = getTheme() === 'dark' ? 'dark-mode-styles' : 'light-mode-styles'; // For internal custom styles if needed

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-50 hover:bg-secondary transition-colors"
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          )}
        </svg>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 w-80 bg-background border border-secondary shadow-2xl rounded-lg flex flex-col z-40 max-h-[80vh] overflow-hidden"
          >
            <div className="bg-primary text-white p-3 flex justify-between items-center rounded-t-lg">
              <h3 className="font-bold">Chatroom</h3>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-accent" aria-label="Minimize Chat">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!isLoggedIn ? (
              <div className="p-4 flex-grow overflow-y-auto">
                <h4 className="text-lg font-semibold text-primary mb-3">Login / Register</h4>
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full p-2 mb-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-text border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-2 mb-4 border rounded-md bg-gray-100 dark:bg-gray-700 text-text border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  onClick={() => handleAuth('login')}
                  className="w-full bg-secondary text-white py-2 rounded-md hover:bg-primary transition-colors mb-2"
                >
                  Login
                </button>
                <button
                  onClick={() => handleAuth('register')}
                  className="w-full bg-accent text-black py-2 rounded-md hover:bg-secondary transition-colors"
                >
                  Register
                </button>
                {authMessage && (
                  <p className={`mt-3 text-sm ${authMessage.startsWith('Error') ? 'text-error' : 'text-primary'}`}>
                    {authMessage}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex-grow overflow-y-auto p-4 space-y-2 text-sm bg-gray-50 dark:bg-gray-800">
                  {chatMessages.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400">No messages yet. Say hello!</p>
                  )}
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="break-words">
                      {msg}
                    </div>
                  ))}
                  <div ref={chatMessagesEndRef} /> {/* Scroll target */}
                </div>
                <div className="p-3 border-t border-secondary flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-grow p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-text border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-accent text-black p-2 rounded-md hover:opacity-90 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}