'use client';

import React, { useState } from 'react';
import { useUserStore } from '@/hooks/userStore'; // Adjust path if different
import Input from '../UI/Input';
import Button from '../UI/Button';

export default function LoginBox() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const {
    login, register, loading, error, loggedin,
  } = useUserStore();

  // Handle Login action
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    useUserStore.setState({ error: '' }); // Clear previous errors

    if (username && password) {
      await login(username, password);
    } else {
      useUserStore.setState({ error: 'Username and password are required.' });
    }
  };

  // Handle Register action
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    useUserStore.setState({ error: '' }); // Clear previous errors

    if (username && password) {
      await register(username, password);
    } else {
      useUserStore.setState({ error: 'Username and password are required.' });
    }
  };

  // If already logged in, this component should not render, as the ChatWindow parent handles it.
  if (loggedin()) {
    return null;
  }

  return (
    <div className="p-4 flex flex-col items-center justify-center h-full text-text bg-background">
      <h2 className="text-xl font-bold mb-4">Account Access</h2>
      <form className="flex flex-col space-y-4 w-full max-w-xs"> {/* Form acts as a container for inputs and buttons */}
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Buttons */}
        <div className="flex justify-between space-x-2">
          <Button
            type="submit" // Use type="submit" for accessibility, but handle via onClick
            onClick={handleLogin}
            className="flex-1"
            disabled={loading}
          >
            {loading ? '...' : 'Login'}
          </Button>
          <Button
            type="submit" // Use type="submit" for accessibility, but handle via onClick
            onClick={handleRegister}
            className="flex-1 bg-secondary"
            disabled={loading}
          >
            {loading ? '...' : 'Register'}
          </Button>
        </div>
      </form>

      {/* Feedback Section */}
      {loading && <p className="text-primary text-sm mt-4">Processing...</p>}
      {error && <p className="text-error text-sm mt-4">{error}</p>}
    </div>
  );
};