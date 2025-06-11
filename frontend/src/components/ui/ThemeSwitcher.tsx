'use client';

import React from 'react';
import { useThemeStore, Theme } from '@/hooks/themeStore';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Theme);
  };

  return <select
    value={theme}
    onChange={handleThemeChange}
    className="
      bg-secondary text-text border border-secondary rounded-md py-1 px-2 pr-8
      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
      cursor-pointer appearance-none bg-no-repeat bg-[length:1.25em_1.25em] bg-[right_0.5em_center]
      bg-[url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'><path d='M7 10l5 5 5-5z'/></svg>')]
      dark: bg-[url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'><path d='M7 10l5 5 5-5z'/></svg>')]
    "
  >
    <option value="system">System</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select >;
};