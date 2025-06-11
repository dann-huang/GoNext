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
      </main>
      <Footer />
    </>
  );
}