'use client';

import useClientStore from '@/hooks/useClientStore';
import { useEffect } from 'react';
import { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

export default function ClientInit() {
  // setup tsParticles
  const { setParticlesInit } = useClientStore();
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesInit(true);
    });
  }, [setParticlesInit]);

  // anti FOUC
  return (
    <script
      dangerouslySetInnerHTML={{
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
    `,
      }}
    />
  );
}
