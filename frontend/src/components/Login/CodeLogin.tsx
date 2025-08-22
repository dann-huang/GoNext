import { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import useUserStore from '@/hooks/useUserStore';
import Button from '../UI/Button';
import Input from '../UI/Input';

interface CodeLoginProps {
  onBack: () => void;
}

export default function CodeLogin({ onBack }: CodeLoginProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const userStore = useUserStore();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setIsLoading(true);
    try {
      const err = await userStore.getLoginCode(email);
      if (err) {
        setError(err.message || 'Failed to send code. Please try again.');
        return;
      }
      setIsCodeSent(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Send code error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Please enter the verification code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const err = await userStore.codeLogin(email, code);
      if (err) {
        setError(err.message || 'Invalid verification code. Please try again.');
      }
      // On success, the user will be redirected by the auth flow
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCodeSent) {
    return (
      <div className="w-full">
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full justify-center"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending...' : 'Send code'}
            </Button>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center mt-2">{error}</div>
          )}
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login options
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            We've sent a 6-digit code to {email}
          </p>
          <label htmlFor="code" className="text-sm font-medium">
            Verification code
          </label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="text-center tracking-widest font-mono"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full justify-center"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify code'}
          </Button>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center mt-2">{error}</div>
        )}
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to login options
        </button>
      </div>
    </div>
  );
}