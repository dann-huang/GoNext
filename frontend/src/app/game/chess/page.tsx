import Footer from '@/components/ui/Footer';
import NavBar from '@/components/ui/NavBar';

export default function ChessPage() {
  return (
    <>
      <NavBar />

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

      <Footer />
    </>
  );
}