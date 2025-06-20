'use client';

import Link from 'next/link';
import Button from '@/components/UI/Button';

export default function LivePage() {
  return <div className="w-full max-w-3xl mx-auto p-6">
    <h1 className="text-3xl font-bold mb-6">Let&apos;s Go Live!</h1>
    
    <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-8 rounded">
      <p className="font-semibold">👋 Getting Started</p>
      <p>Choose an activity below to begin. The chat window is in the bottom right corner.</p>
    </div>

    <div className="space-y-8">
      <section className="bg-surface p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">🎮 Board Games</h2>
        <p className="mb-4">
          Play real-time board games with friends. Join a room and challenge your friends to a game!
        </p>
        <Link href="/live/boardgame">
          <Button>Play Board Games</Button>
        </Link>
      </section>

      <section className="bg-surface p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">🎨 Collaborative Drawing</h2>
        <p className="mb-4">
          Draw together with friends in real-time. Create amazing artwork together!
        </p>
        <Link href="/live/draw">
          <Button>Start Drawing</Button>
        </Link>
      </section>

      <section className="bg-surface p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">📹 Video Chat</h2>
        <p className="mb-4">
          Video chat with your friends while playing games or just hanging out.
        </p>
        <Link href="/live/video">
          <Button>Start Video Chat</Button>
        </Link>
      </section>
    </div>
  </div>;
}
