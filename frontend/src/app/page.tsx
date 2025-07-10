import Link from 'next/link';
import { AlternatingSection, SectionContent } from '@/components/layout/AlternatingSection';
import Button from '@/components/UI/Button';
import { Gamepad2, PencilRuler, Video, Users, User2, Github } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative h-screen w-full bg-background overflow-hidden flex items-center justify-center">
        {/* Interactive Canvas Placeholder */}
        <div 
          id="interactive-canvas" 
          className="absolute inset-0 z-0"
          // Will be used for the dots animation
        />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold text-primary mb-6">
            Let&apos;s Go!
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
            A collection of interactive experiences built with modern web technologies
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/live">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Live Features
              </Button>
            </Link>
            <Link href="#what-is-this">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-foreground/60">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Who Am I Section */}
      <AlternatingSection bg="card">
        <SectionContent>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-accent/10 flex items-center justify-center">
            <User2 className="h-32 w-32 text-accent" />
          </div>
        </SectionContent>
        
        <SectionContent className="space-y-4">
          <h2 className="text-4xl font-bold text-primary mb-6">Who Am I</h2>
          <p className="text-foreground/90">
            Hi there! I&apos;m a passionate developer who loves creating interactive experiences on the web.
          </p>
          <p className="text-foreground/90">
            This project is my playground for experimenting with real-time web technologies
            and building fun, collaborative tools that people can enjoy together.
          </p>
          <div className="pt-4">
            <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="gap-2">
                <Github className="h-5 w-5" />
                View on GitHub
              </Button>
            </a>
          </div>
        </SectionContent>
      </AlternatingSection>

      {/* What Is This Section */}
      <AlternatingSection reverse id="what-is-this">
        <SectionContent>
          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: <Gamepad2 className="h-12 w-12" />, title: "Board Games" },
              { icon: <PencilRuler className="h-12 w-12" />, title: "Drawing" },
              { icon: <Video className="h-12 w-12" />, title: "Video Chat" },
              { icon: <Users className="h-12 w-12" />, title: "Collaborate" },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl bg-background/50 hover:bg-background transition-colors">
                <div className="text-accent mb-2">{item.icon}</div>
                <h3 className="font-medium">{item.title}</h3>
              </div>
            ))}
          </div>
        </SectionContent>
        
        <SectionContent className="space-y-4">
          <h2 className="text-4xl font-bold text-primary mb-6">What Is This?</h2>
          <p className="text-foreground/90">
            Let&apos;s Go is a collection of interactive, real-time experiences you can enjoy with friends.
          </p>
          <p className="text-foreground/90">
            From classic board games to creative drawing sessions, everything happens in real-time in your browser.
            No downloads, no installations - just pure web magic!
          </p>
          <div className="pt-4">
            <Link href="/live">
              <Button>
                Try It Out
              </Button>
            </Link>
          </div>
        </SectionContent>
      </AlternatingSection>
    </main>
  );
}