import { useState } from 'react';
import { GameName, GAME_NAMES } from '@/types/wsTypes';
import { GAME_DISPLAY_NAMES } from '@/config/consts';
import Button from '@/components/UI/Button';

interface CreateGameProps {
  createGame: (gameName: GameName) => void | Promise<void>;
  isLoading?: boolean;
}

export default function CreateGame({
  createGame,
  isLoading = false,
}: CreateGameProps) {
  const [selectedGame, setSelectedGame] = useState<GameName>(GAME_NAMES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGame && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await Promise.resolve(createGame(selectedGame));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="p-6 bg-surface rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
        Create a New Game
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="game-select" className="block text-sm font-medium">
            Select Game
          </label>
          <select
            id="game-select"
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value as GameName)}
            className="w-full p-2.5 rounded-md border border-secondary border-2
          bg-background text-foreground text-sm
          focus:ring-2 focus:ring-secondary/50 focus:border-secondary"
            disabled={isLoading || isSubmitting}
          >
            {GAME_NAMES.map((gameName) => (
              <option
                key={gameName}
                value={gameName}
                className="bg-background text-foreground"
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
