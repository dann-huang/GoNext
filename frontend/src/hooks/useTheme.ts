import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (newTheme: Theme) => void;
  applyTheme: (theme: Theme) => void;
  getTheme: () => Theme;
}

const initialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system')
        return storedTheme;
    } catch (e) {
      console.error("Failed to get stored theme", e);
    }
  }
  return 'system';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: initialTheme(),

      setTheme: (t: Theme) => {
        set({ theme: t });
        get().applyTheme(t);
      },

      applyTheme: (currentTheme: Theme) => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (currentTheme === 'dark') {
          root.classList.add('dark');
        } else if (currentTheme === 'light') {
          root.classList.remove('dark');
        } else { // 'system'
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },

      getTheme: () => {
        const theme = get().theme;

        return theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          : theme;
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => state => {
        if (state) {
          state.applyTheme(state.theme);
        }
      },
    }
  )
);

//for handling system pref change
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = useThemeStore.getState().theme;
    if (currentTheme === 'system') {
      useThemeStore.getState().applyTheme('system');
    }
  });
}