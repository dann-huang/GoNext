// app/game/chess/page.tsx
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function ChessPage() {
  return (
    <>
      <header className="bg-primary text-white p-4 shadow-md">
        <nav className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">My Awesome Site</Link>
          <div className="space-x-4 flex items-center">
            <Link href="/" className="text-white hover:text-secondary">Home</Link>
            <Link href="/game/chess" className="text-white hover:text-secondary">Chess Game</Link>
            <Link href="/game/cards" className="text-white hover:text-secondary">Cards Game</Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-extrabold mb-6 text-primary">
          Play Chess!
        </h1>
        <p className="text-lg mb-8 max-w-2xl text-text">
          Prepare your strategy and make your moves on this grand chessboard.
          This is where the battle of wits unfolds!
        </p>

        <div className="bg-secondary p-6 rounded-xl shadow-xl border-4 border-accent">
          <div className="w-80 h-80 bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-mono">
            [Chess Game Board Placeholder]
            <br />
            (You would integrate a real chess game here!)
          </div>
          <button className="mt-6 bg-accent text-black font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition duration-300">
            New Game
          </button>
          <button className="mt-6 ml-4 bg-error text-white font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition duration-300">
            Resign
          </button>
        </div>

        <p className="mt-10 text-sm text-text opacity-70">
          Powered by critical thinking and a purple passion.
        </p>
      </main>

      <footer className="bg-primary text-white text-center p-4 text-sm">
        &copy; 2025 My Awesome Site. All rights reserved.
      </footer>
    </>
  );
}