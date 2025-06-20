import React from 'react';
import Link from 'next/link';
import Dropdown from './Dropdown';
import ThemeSwitcher from './ThemeSwitcher';
import { Earth } from 'lucide-react';

export default function NavBar() {
  return <nav className="bg-primary text-on-primary shadow-md py-3 px-6 flex justify-between items-center w-full">
    <div className="flex items-center space-x-2">
      <Link href="/" className="flex items-center">
        <Earth />
        <span className="text-xl text-on-primary font-bold ml-2 hidden sm:block">LetsGo</span>
      </Link>
    </div>

    <div className="flex space-x-4 md:space-x-8">
      <Dropdown
        title="Static"
        links={[
          { href: "/board/connect4", label: "Connect 4" },
          { href: "/", label: "Thing 2" },
          { href: "/about", label: "About Me" },
        ]}
      />
      <Dropdown
        title="Live"
        links={[
          { href: "/live/video", label: "Video call" },
          { href: "/live/draw", label: "Drawing" },
          { href: "/live/boardgame", label: "Board games" },
        ]}
      />
      <ThemeSwitcher />
    </div>
  </nav>;
}