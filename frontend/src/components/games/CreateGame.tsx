'use client';

import { useState } from 'react';
import { GameName, GAME_NAMES } from '@/types/wsTypes';
import { GAME_DISPLAY_NAMES } from '@/config/consts';
import Button from '@/components/UI/Button';
import { cn } from '@/lib/utils';

interface CreateGameProps {
  onCreateGame: (gameName: GameName) => void | Promise<void>;
  className?: string;
  isLoading?: boolean;
}

export function CreateGame({
  onCreateGame,
  className = '',
  isLoading = false
}: CreateGameProps) {
  const [selectedGame, setSelectedGame] = useState<GameName>(GAME_NAMES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGame && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await Promise.resolve(onCreateGame(selectedGame));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className={cn('w-full max-w-md mx-auto p-6 bg-card rounded-lg shadow-sm', className)}>
      <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
        Create a New Game
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="game-select"
            className="block text-sm font-medium text-foreground/80"
          >
            Select Game
          </label>
          <select
            id="game-select"
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value as GameName)}
            className={cn(
              'w-full p-2.5 rounded-md border border-input',
              'bg-background text-foreground text-sm',
              'focus:ring-2 focus:ring-primary/50 focus:border-primary',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:bg-muted/20 dark:border-muted/30'
            )}
            disabled={isLoading || isSubmitting}
          >
            {GAME_NAMES.map((gameName) => (
              <option
                key={gameName}
                value={gameName}
                className="bg-background text-foreground dark:bg-card"
              >
                {GAME_DISPLAY_NAMES[gameName]}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading || isSubmitting}
          disabled={isLoading || isSubmitting}
          className="mt-2 font-medium"
        >
          Create Game
        </Button>
      </form>
    </div>
  );
}
