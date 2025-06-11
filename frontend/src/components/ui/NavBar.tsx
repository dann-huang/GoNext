'use client';

import React from 'react';
import Link from 'next/link';
import Dropdown from './Dropdown';
import ThemeSwitcher from './ThemeSwitcher';


const Logo = () => <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="currentColor"
  className="w-8 h-8 text-secondary"
>
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.93-2.5l-2.41-2.41c-.6-.6-.93-1.41-.93-2.29V9h-1V6.07c3.95.49 7 3.85 7 7.93 0 .62-.08 1.21-.21 1.79z" />
</svg>;

export default function NavBar() {
  return (
    <nav className="bg-primary text-text shadow-md py-3 px-6 flex justify-between items-center w-full font-sans">
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center">
          <Logo />
          <span className="text-xl font-bold ml-2 hidden sm:block">My App</span>
        </Link>
      </div>

      <div className="flex space-x-4 md:space-x-8">
        <Dropdown
          title="Stuff"
          links={[
            { href: "/", label: "thing1" },
            { href: "/", label: "thing2" },
            { href: "/", label: "thing3" },
            { href: "/", label: "thing1" },
            { href: "/about", label: "About Me" },
          ]}
        />
        <ThemeSwitcher />
      </div>
    </nav>
  );
};