import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import useUserStore from '@/hooks/useUserStore';
import Button from '../UI/Button';
import Input from '../UI/Input';

interface PasswordLoginProps {
  onBack: () => void;
}

export default function PasswordLogin({ onBack }: PasswordLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const userStore = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const err = await userStore.passLogin(email, password);
      if (err) {
        setError(err.message || 'Failed to log in. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full justify-center"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
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
