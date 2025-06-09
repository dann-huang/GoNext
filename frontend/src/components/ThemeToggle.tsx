'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/hooks/themeStore';

export default function ThemeToggle() {
  const { theme, setTheme, getTheme } = useThemeStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  if (!mounted) {
    return (
      <button
        className="bg-accent text-black px-3 py-1 rounded-md text-sm font-semibold opacity-50 cursor-not-allowed"
        disabled
      >
        Loading...
      </button>
    );
  }

  const toggleTheme = () => {
    let newTheme = getTheme();
    if (theme === 'dark') {
      newTheme = 'light';
    } else if (theme === 'light') {
      newTheme = 'system';
    } else {
      newTheme = 'dark';
    }
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="bg-accent text-black px-3 py-1 rounded-md text-sm font-semibold"
    >
      {theme === 'dark' ? 'Dark'
        : theme === 'light' ? 'Light'
          : 'System'}
    </button>
  );
}