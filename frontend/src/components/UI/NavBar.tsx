import Link from 'next/link';
import Dropdown from './Dropdown';
import ThemeSwitcher from './ThemeSwitcher';
import Logo from '@/assets/gonext.svg';

export default function NavBar() {
  return (
    <nav className="bg-primary text-on-primary shadow-md py-3 px-6 flex justify-between items-center w-full">
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center">
          <Logo className="h-10 w-auto fill-on-primary" viewBox="0 0 720 460" />
        </Link>
      </div>

      <div className="flex space-x-4 md:space-x-8">
        <Dropdown
          title="Static"
          links={[
            { href: '/minesweeper', label: 'Minesweeper' },
            { href: '/', label: 'Thing 2' },
            { href: '/', label: 'Thing 3' },
          ]}
        />
        <Dropdown
          title="Live"
          links={[
            { href: '/live/video', label: 'Video call' },
            { href: '/live/draw', label: 'Drawing' },
            { href: '/live/boardgame', label: 'Board games' },
          ]}
        />
        <ThemeSwitcher />
      </div>
    </nav>
  );
}
