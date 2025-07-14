import Link from 'next/link';
import {
  AlternatingSection,
  SectionContent,
} from '@/components/layout/AlternatingSection';
import TitleBanner from '@/components/UI/particles/ParticleBanner';
import { Gamepad2, PencilRuler, Video, User2, Github } from 'lucide-react';
import Logo from '@/assets/gonext.svg';
import ParticleBox from '@/components/UI/ParticleBox';

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center">
        <ParticleBox />
        <TitleBanner>
          <Logo
            className="w-full h-auto fill-primary p-12"
            viewBox="0 0 720 460"
          />
        </TitleBanner>
        <p className="mt-6 text-lg md:text-xl max-w-2xl text-center px-4">
          Interactive experiences built with Go and Next.js
        </p>
        <a
          href="https://github.com/dann-huang/gonext"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-md font-medium 
          transition-colors bg-primary text-on-primary hover:bg-primary/80 h-12 px-6 text-base mt-6"
        >
          <Github className="h-5 w-5 mr-2" />
          View on GitHub
        </a>
      </section>

      <section id="content" className="py-16">
        <AlternatingSection reverse id="what-is-this">
          <SectionContent>
            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  icon: <Gamepad2 className="h-12 w-12" />,
                  title: 'Board Games',
                  href: '/live/boardgame',
                },
                {
                  icon: <PencilRuler className="h-12 w-12" />,
                  title: 'Drawing',
                  href: '/live/draw',
                },
                {
                  icon: <Video className="h-12 w-12" />,
                  title: 'Video Chat',
                  href: '/live/video',
                },
                {
                  icon: <Gamepad2 className="h-12 w-12" />,
                  title: 'Minesweeper',
                  href: '/live/minesweeper',
                },
              ].map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="block p-6 rounded-xl bg-background/50 hover:bg-background transition-colors"
                >
                  <div className="text-accent mb-2">{item.icon}</div>
                  <h3 className="font-medium">{item.title}</h3>
                </Link>
              ))}
            </div>
          </SectionContent>

          <SectionContent className="space-y-4">
            <h2 className="text-4xl font-bold text-primary mb-6">
              What Is This?
            </h2>
            <p>
              Go Next is a collection of fun things I&apos;ve built for you to
              enjoy with friends.
            </p>
            <p>
              From classic board games to creative drawing sessions, everything
              happens in real-time in your browser. No downloads, no
              installations - just pure web magic!
            </p>
            <p>Choose something from the right to try it out!</p>
          </SectionContent>
        </AlternatingSection>

        <AlternatingSection bg="card">
          <SectionContent>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-accent/10 flex items-center justify-center">
              <User2 className="h-32 w-32 text-accent" />
            </div>
          </SectionContent>
          <SectionContent className="space-y-4">
            <h2 className="text-4xl font-bold text-primary mb-6">Who Am I</h2>
            <p>
              Hi there! I&apos;m a passionate developer who loves creating
              interactive experiences on the web.
            </p>
            <p>
              This project is my playground for experimenting with real-time web
              technologies and building fun, collaborative tools that people can
              enjoy together.
            </p>
          </SectionContent>
        </AlternatingSection>
      </section>
    </main>
  );
}
