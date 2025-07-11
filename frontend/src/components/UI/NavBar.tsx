'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';
import Logo from '@/assets/gonext.svg';

interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: 'Static',
    href: '#',
    children: [
      { href: '/minesweeper', title: 'Minesweeper' },
    ],
  },
  {
    title: 'Live',
    href: '/live',
    children: [
      { href: '/live/video', title: 'Video call' },
      { href: '/live/draw', title: 'Drawing' },
      { href: '/live/boardgame', title: 'Board games' },
    ],
  },
];

const NavLink = ({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <Link
    href={item.href}
    onClick={onClick}
    className={`block px-4 py-2 text-on-primary hover:bg-accent/20 hover:text-accent transition-colors duration-200 rounded-md ${
      isActive ? 'font-semibold bg-accent/10 text-accent' : ''
    }`}
  >
    {item.title}
  </Link>
);

const MobileNavItem = ({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive =
    pathname === item.href ||
    item.children?.some((child) => child.href === pathname);

  return (
    <div className="w-full">
      <div
        className="flex items-center justify-between w-full px-4 py-2 text-on-primary hover:bg-accent/20 hover:text-accent rounded-md cursor-pointer transition-colors duration-200"
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <span className={isActive && !hasChildren ? 'font-semibold' : ''}>
          {item.title}
        </span>
        {hasChildren && (
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={`block px-4 py-2 text-sm text-on-primary/90 hover:bg-accent/20 hover:text-accent rounded-md transition-colors duration-200 ${
                pathname === child.href
                  ? 'font-medium bg-accent/10 text-accent'
                  : ''
              }`}
            >
              {child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Logo
                className="h-10 w-auto fill-on-primary"
                viewBox="0 0 720 460"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item, i) => {
              const hasChildren = item.children && item.children.length > 0;
              const isActive =
                pathname === item.href ||
                item.children?.some((child) => child.href === pathname);

              if (hasChildren) {
                return (
                  <div key={item.title} className="relative group">
                    <button
                      className={`px-4 py-2 rounded-md flex items-center space-x-1 ${
                        isActive
                          ? 'bg-primary-hover'
                          : 'hover:bg-primary-hover/50'
                      }`}
                    >
                      <span>{item.title}</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div className="absolute left-0 mt-1 w-56 rounded-md shadow-lg bg-primary border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="py-1">
                        {item.children?.map((child) => (
                          <NavLink
                            key={child.href}
                            item={child}
                            isActive={pathname === child.href}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <NavLink key={item.href} item={item} isActive={isActive} />
              );
            })}
            <div className="ml-2">
              <ThemeSwitcher />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-on-primary hover:bg-primary-hover focus:outline-none"
              aria-expanded={isOpen}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-6 h-5">
                <span
                  className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`absolute left-0 w-6 h-0.5 bg-current transition-opacity duration-200 ${
                    isOpen
                      ? 'opacity-0'
                      : 'opacity-100 top-1/2 -translate-y-1/2'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isOpen
                      ? 'top-1/2 -translate-y-1/2 -rotate-45'
                      : 'top-full -translate-y-full'
                  }`}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3 bg-primary/95 backdrop-blur-sm">
          {navItems.map((item) => (
            <MobileNavItem key={item.href} item={item} pathname={pathname} />
          ))}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-on-primary/90">Theme</span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
