import Link from 'next/link';
import NavBar from '@/components/ui/NavBar';
import Footer from '@/components/ui/Footer';

export default function HomePage() {
  return (
    <>
      <NavBar />

      <main className="flex-grow container mx-auto p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-extrabold mb-6 text-primary">
          Hello There!
        </h1>
        <p className="text-lg mb-8 max-w-2xl text-text">
          Welcome to a delightful journey through my purple-themed pages. Explore some fun games below!
        </p>
        <div className="space-x-6">
          <Link href="/game/chess" className="inline-block bg-secondary text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-accent hover:text-black transition duration-300">
            Play Chess
          </Link>
          <Link href="/game/cards" className="inline-block bg-secondary text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-accent hover:text-black transition duration-300">
            Play Cards
          </Link>
        </div>
        <p className="mt-10 text-sm text-text opacity-70">
          This site proudly uses a custom purple-leaning theme with Tailwind CSS v4 and Next.js.
        </p>
      </main>

      <Footer />
    </>
  );
}