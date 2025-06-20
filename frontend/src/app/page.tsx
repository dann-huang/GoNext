import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-5xl font-extrabold mb-6 text-primary">
          Let's Go!
        </h1>
        
        <p className="text-xl text-foreground/90">
          A collection of random things I made.
        </p>
        
        <p className="text-lg text-foreground/70">
          Currently featuring live board games, collaborative drawing, and video chat.
        </p>
        
        <div className="pt-6">
          <Link 
            href="/live"
            className="px-6 py-3 bg-primary text-on-primary rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Explore Live Features →
          </Link>
        </div>
        
        <p className="text-sm text-foreground/50 pt-8">
          More static content coming soon! Let me know if you'd like to see anything specific.
        </p>
      </div>
    </div>
  );
}