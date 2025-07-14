import { useState } from 'react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { Loader2 } from 'lucide-react';
import useUserStore from '@/hooks/useUserStore';

export default function LoginGuest() {
  const userStore = useUserStore();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setIsLoading(true);
    setError('');

    const err = await userStore.guestLogin(name);
    if (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mt-4">
      <label htmlFor="name" className="text-sm">
        What should we call you?
      </label>
      <Input
        id="name"
        type="text"
        placeholder="Enter name here"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        className="w-full mt-2"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-text/30 mt-1">
        Guest accounts will become inaccessible after 24 hours of inactivity,
        but you can always create a new one.
      </p>
      <Button
        type="submit"
        className="w-full mt-3"
        disabled={isLoading || !name.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Get Started'
        )}
      </Button>
    </form>
  );
}
