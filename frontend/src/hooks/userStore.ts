import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  username: string | null;
  displayName: string | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, displayName: string, token: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      username: null,
      displayName: null,
      token: null,
      isAuthenticated: false,
      login: (username: string, displayName: string, token: string | null) => set({ username, displayName, token, isAuthenticated: true }),
      logout: () => set({ username: null, displayName: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);