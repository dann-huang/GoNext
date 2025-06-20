'use client';

// anti FOUC
export default function ThemeInitializer() {
  return <script dangerouslySetInnerHTML={{
    __html: `
      (function () {
        try {
          const themeStr = localStorage.getItem('theme-store');
          const themeJson = themeStr ? JSON.parse(themeStr) : {};
          const theme = themeJson.state ? themeJson.state.theme : 'system';

          const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

          if (theme === 'dark' || (theme === 'system' && darkMode)) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (e) { console.error('theme script failed', e); }
      })()
    `
  }} />;
} 