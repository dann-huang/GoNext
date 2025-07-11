import { useState } from 'react';
import useUserStore from '@/hooks/useUserStore';
import Input from '../UI/Input';
import Button from '../UI/Button';

type LoginTab = 'guest' | 'email-code' | 'email-password';

export default function LoginBox() {
  const [activeTab, setActiveTab] = useState<LoginTab>('guest');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { 
    registerAsGuest, 
    requestEmailCode, 
    loginWithEmailCode, 
    loginWithPassword 
  } = useUserStore();

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }
    setIsLoading(true);
    try {
      await registerAsGuest(displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
      setIsLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setIsLoading(true);
    try {
      await requestEmailCode(email);
      setIsCodeSent(true);
      setError('Verification code sent to your email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }
    setIsLoading(true);
    try {
      await loginWithEmailCode(email, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setIsLoading(true);
    try {
      await loginWithPassword(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const resetEmailFlow = () => {
    setIsCodeSent(false);
    setCode('');
    setError('');
  };

  return (
    <div className='w-full max-w-md p-6 mx-auto bg-surface rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold text-center mb-6'>Welcome</h2>
      
      {/* Tabs */}
      <div className='flex border-b border-gray-200 mb-6'>
        <button
          type='button'
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'guest'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('guest')}
        >
          Guest
        </button>
        <button
          type='button'
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'email-code'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setActiveTab('email-code');
            resetEmailFlow();
          }}
        >
          Email Code
        </button>
        <button
          type='button'
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'email-password'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('email-password')}
        >
          Email/Password
        </button>
      </div>
      
      {/* Tab Content */}
      <div className='space-y-4'>
        {activeTab === 'guest' ? (
          <form onSubmit={handleGuestSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='displayName' className='block text-sm font-medium text-gray-700'>
                What should we call you?
              </label>
              <Input
                id='displayName'
                type='text'
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder='Enter your display name'
                className='w-full'
                autoComplete='off'
                disabled={isLoading}
                required
              />
            </div>
            {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
            <Button
              type='submit'
              className='w-full justify-center'
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Continue as Guest'}
            </Button>
          </form>
        ) : activeTab === 'email-code' ? (
          <div className='space-y-4'>
            {!isCodeSent ? (
              <form onSubmit={handleRequestCode} className='space-y-4'>
                <div className='space-y-2'>
                  <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                    Email
                  </label>
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Enter your email'
                    className='w-full'
                    autoComplete='email'
                    disabled={isLoading}
                  />
                </div>
                {error && <p className='text-red-500 text-sm'>{error}</p>}
                <Button
                  type='submit'
                  className='w-full justify-center'
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending code...' : 'Send Verification Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleEmailCodeLogin} className='space-y-4'>
                <div className='space-y-2'>
                  <label htmlFor='code' className='block text-sm font-medium text-gray-700'>
                    Verification Code
                  </label>
                  <Input
                    id='code'
                    type='text'
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder='Enter the 6-digit code'
                    className='w-full'
                    autoComplete='one-time-code'
                    disabled={isLoading}
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Check your email for the verification code
                  </p>
                </div>
                <div className='flex justify-between items-center'>
                  <button
                    type='button'
                    onClick={resetEmailFlow}
                    className='text-sm text-primary hover:underline'
                    disabled={isLoading}
                  >
                    Use a different email
                  </button>
                  <button
                    type='button'
                    onClick={handleRequestCode}
                    className='text-sm text-primary hover:underline'
                    disabled={isLoading}
                  >
                    Resend code
                  </button>
                </div>
                {error && <p className='text-red-500 text-sm'>{error}</p>}
                <Button
                  type='submit'
                  className='w-full justify-center'
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleEmailPasswordLogin} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='email-password' className='block text-sm font-medium text-gray-700'>
                Email
              </label>
              <Input
                id='email-password'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email'
                className='w-full'
                autoComplete='email'
                disabled={isLoading}
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                Password
              </label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Enter your password'
                className='w-full'
                autoComplete='current-password'
                disabled={isLoading}
              />
            </div>
            {error && <p className='text-red-500 text-sm'>{error}</p>}
            <div className='flex justify-end'>
              <button
                type='button'
                className='text-sm text-primary hover:underline'
                onClick={() => setActiveTab('email-code')}
              >
                Forgot password?
              </button>
            </div>
            <Button
              type='submit'
              className='w-full justify-center'
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login with Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};