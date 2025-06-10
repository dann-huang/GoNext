import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function NavBar() {
  return <header className="bg-primary text-text p-4 shadow-md">
    <nav className="container mx-auto flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">My Awesome Site</Link>
      <div className="space-x-4 flex items-center">
        <Link href="/" className="text-text hover:text-secondary">Home</Link>
        <Link href="/game/chess" className="text-text hover:text-secondary">Chess Game</Link>
        <Link href="/game/cards" className="text-text hover:text-secondary">Cards Game</Link>
        <ThemeToggle />
      </div>
    </nav>
  </header>
};