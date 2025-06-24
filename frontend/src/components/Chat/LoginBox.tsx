'use client';

import React, { useState } from 'react';
import { useUserStore } from '@/hooks/useUserStore'; // Adjust path if different
import Input from '../UI/Input';
import Button from '../UI/Button';

export default function LoginBox() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const { login, register, loading, error, } = useUserStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    useUserStore.setState({ error: '' });

    if (username && password) {
      setSuccess(await login(username, password));
    } else {
      useUserStore.setState({ error: 'Username and password are required.' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    useUserStore.setState({ error: '' });

    if (username && password) {
      setSuccess(await register(username, password));
    } else {
      useUserStore.setState({ error: 'Username and password are required.' });
    }
  };

  return <div className='p-4 flex flex-col items-center justify-center h-full text-text bg-surface'>
    <h2 className='text-xl font-bold mb-2'>Account Access</h2>
    <p className='text-sm text-center'> Username should be 3+ characters alphanum.</p>
    <p className='text-sm text-center mb-2'> Password just needs to exist.</p>
    <form className='flex flex-col space-y-4 w-full max-w-xs'> {/* Form acts as a container for inputs and buttons */}
      <Input
        type='text'
        placeholder='Username'
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <Input
        type='password'
        placeholder='Password'
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />

      <div className='flex justify-between space-x-2'>
        <Button
          type='submit'
          onClick={handleLogin}
          className='flex-1'
          disabled={loading}
        >
          {loading ? '...' : 'Login'}
        </Button>
        <Button
          type='submit'
          onClick={handleRegister}
          variant='secondary'
          className='flex-1'
          disabled={loading}
        >
          {loading ? '...' : 'Register'}
        </Button>
      </div>
    </form>

    {loading && <p className='text-primary text-sm mt-4'>Processing...</p>}
    {error && <p className='text-error text-sm mt-4'>{error}</p>}
    {success && <p className='text-primary text-sm mt-4'>Success!</p>}
  </div>;
};