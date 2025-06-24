'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Button from './Button';

interface DropdownLink {
  href: string;
  label: string;
}

interface DropdownProps {
  title: string;
  links: DropdownLink[];
}

export default function Dropdown({ title, links }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return <div className='relative' ref={dropdownRef}>
    <Button
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
      aria-haspopup='true'
      color='secondary'
    >
      {title}
      <svg
        className={`ml-2 w-4 h-4 inline-block transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'></path>
      </svg>
    </Button>

    <div
      className={`
          absolute left-0 mt-2 w-48 bg-secondary border border-secondary rounded-md shadow-lg
          z-20 flex flex-col gap-y-1 px-4 py-3 transition-all duration-300 ease-out
          ${isOpen
          ? 'opacity-100 max-h-[5500px] pointer-events-auto visible' // max height here
          : 'opacity-0 max-h-0 pointer-events-none invisible overflow-hidden'
        }
        `}
    >
      {links.map((link, index) => <Link
        key={index}
        href={link.href}
        className='block py-1 text-lg text-on-secondary hover:text-primary transition-colors duration-200'
        onClick={() => setIsOpen(false)}
      >
        {link.label}
      </Link>
      )}
    </div>
  </div>;
};