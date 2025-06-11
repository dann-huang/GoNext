import Footer from '@/components/ui/Footer';
import NavBar from '@/components/ui/NavBar';

export default function ChessPage() {
  return (
    <>
      <NavBar />

      <main className="flex-grow container mx-auto p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-extrabold mb-6 text-primary">
          Chess stuff goes here
        </h1>

      </main>

      <Footer />
    </>
  );
}