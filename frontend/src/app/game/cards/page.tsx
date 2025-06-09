
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function CardsPage() {
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
          Let's Play Cards!
        </h1>
        <p className="text-lg mb-8 max-w-2xl text-text">
          Shuffle the deck, draw your hand, and may the best player win.
          Get ready for some thrilling card action!
        </p>

        <div className="bg-secondary p-6 rounded-xl shadow-xl border-4 border-accent flex flex-wrap justify-center gap-4">
          {/* Example Cards */}
          <div className="w-24 h-36 bg-white rounded-md shadow-md flex items-center justify-center text-lg font-bold text-gray-800 border border-gray-300">
            ♠️ K
          </div>
          <div className="w-24 h-36 bg-white rounded-md shadow-md flex items-center justify-center text-lg font-bold text-error border border-gray-300">
            ♥️ Q
          </div>
          <div className="w-24 h-36 bg-white rounded-md shadow-md flex items-center justify-center text-lg font-bold text-gray-800 border border-gray-300">
            ♣️ A
          </div>
          <div className="w-24 h-36 bg-white rounded-md shadow-md flex items-center justify-center text-lg font-bold text-error border border-gray-300">
            ♦️ 10
          </div>
          {/* More cards would go here */}
          <div className="w-24 h-36 bg-primary rounded-md shadow-md flex items-center justify-center text-white text-sm font-mono">
            [Deck]
          </div>
        </div>

        <button className="mt-8 bg-accent text-black font-semibold py-3 px-8 rounded-lg hover:opacity-90 transition duration-300">
          Draw Card
        </button>

        <p className="mt-10 text-sm text-text opacity-70">
          Card-tastic fun awaits!
        </p>
      </main>

      <footer className="bg-primary text-white text-center p-4 text-sm">
        &copy; 2025 My Awesome Site. All rights reserved.
      </footer>
    </>
  );
}