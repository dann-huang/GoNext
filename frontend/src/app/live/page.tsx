import Link from 'next/link';
import Button from '@/components/UI/Button';

export default function LivePage() {
  return <div className="container mx-auto p-6 max-w-4xl">
    <h1 className="text-3xl font-bold mb-6">Welcome to Let's Go Live!</h1>

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

      <div className="text-center text-sm text-foreground/70 mt-8">
        <p>Create or join a room to get started. All features work in real-time across devices!</p>
      </div>
    </div>
  </div>;
}
