import Link from 'next/link';
import {
  AlternatingSection,
  SectionContent,
} from '@/components/layout/AlternatingSection';
import Button from '@/components/UI/Button';
import TitleBanner from '@/components/UI/particles/ParticleBanner';
import {
  Gamepad2,
  PencilRuler,
  Video,
  Users,
  User2,
  Github,
  ChevronDown,
} from 'lucide-react';
import Logo from '@/assets/gonext.svg';

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center">
        <TitleBanner>
          <Logo
            className="w-full h-auto fill-primary p-12"
            viewBox="0 0 720 460"
          />
        </TitleBanner>
        <p className="mt-6 text-lg md:text-xl text-foreground/80 max-w-2xl text-center px-4">
          Interactive experiences built with Go and Next.js
        </p>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 p-2">
          <ChevronDown className="h-8 w-8 text-on-primary" strokeWidth={2} />
        </div>
      </section>

      <section id="content" className="py-16">
        <AlternatingSection bg="card">
          <SectionContent>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-accent/10 flex items-center justify-center">
              <User2 className="h-32 w-32 text-accent" />
            </div>
          </SectionContent>
          <SectionContent className="space-y-4">
            <h2 className="text-4xl font-bold text-primary mb-6">Who Am I</h2>
            <p className="text-foreground/90">
              Hi there! I&apos;m a passionate developer who loves creating
              interactive experiences on the web.
            </p>
            <p className="text-foreground/90">
              This project is my playground for experimenting with real-time web
              technologies and building fun, collaborative tools that people can
              enjoy together.
            </p>
            <div className="pt-4">
              <a
                href="https://github.com/dann-huang/gonext"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" className="gap-2">
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
                {
                  icon: <Gamepad2 className="h-12 w-12" />,
                  title: 'Board Games',
                },
                {
                  icon: <PencilRuler className="h-12 w-12" />,
                  title: 'Drawing',
                },
                { icon: <Video className="h-12 w-12" />, title: 'Video Chat' },
                { icon: <Users className="h-12 w-12" />, title: 'Collaborate' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl bg-background/50 hover:bg-background transition-colors"
                >
                  <div className="text-accent mb-2">{item.icon}</div>
                  <h3 className="font-medium">{item.title}</h3>
                </div>
              ))}
            </div>
          </SectionContent>

          <SectionContent className="space-y-4">
            <h2 className="text-4xl font-bold text-primary mb-6">
              What Is This?
            </h2>
            <p className="text-foreground/90">
              Let&apos;s Go is a collection of interactive, real-time
              experiences you can enjoy with friends.
            </p>
            <p className="text-foreground/90">
              From classic board games to creative drawing sessions, everything
              happens in real-time in your browser. No downloads, no
              installations - just pure web magic!
            </p>
            <div className="pt-4">
              <Link href="/live">
                <Button>Try It Out</Button>
              </Link>
            </div>
          </SectionContent>
        </AlternatingSection>
      </section>
    </main>
  );
}
