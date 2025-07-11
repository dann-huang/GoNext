import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useUserRoute from './useUserRoute';
import { UserInfo } from '@/types/authTypes';

interface UserState extends Omit<UserInfo, 'accountType'> {
  loading: boolean;
  accessExp: number;
  error: string;
  isGuest: boolean;
  registerAsGuest: (displayName: string) => Promise<boolean>;
  requestEmailCode: (email: string) => Promise<boolean>;
  loginWithEmailCode: (email: string, code: string) => Promise<boolean>;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  clearError: () => void;
  accessValid: () => boolean;
}

const blankUser = {
  username: '',
  displayName: '',
  loading: false,
  accessExp: 0,
  error: '',
  isGuest: false,
};

const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      const userRoute = useUserRoute();

      return {
        ...blankUser,
        registerAsGuest: async (displayName: string) => {
          set({ loading: true, error: '' });
          try {
            const { user, accessExp: accessExpires } =
              await userRoute.registerAsGuest(displayName);
            set({
              username: user.username,
              displayName: user.displayName,
              accessExp: accessExpires * 1000, // Convert to milliseconds
              isGuest: user.accountType === 'guest',
              loading: false,
              error: '',
            });
            return true;
          } catch (err: unknown) {
            console.error('userstore register err ', err);
            const msgErr = err as { message: string };
            set({ error: msgErr.message, loading: false });
            return false;
          }
        },
        requestEmailCode: async (email: string) => {
          set({ loading: true, error: '' });
          try {
            await userRoute.requestEmailCode(email);
            set({ loading: false });
            return true;
          } catch (err: unknown) {
            console.error('Failed to request email code:', err);
            const msgErr = err as { message: string };
            set({ error: msgErr.message, loading: false });
            return false;
          }
        },
        loginWithEmailCode: async (email: string, code: string) => {
          set({ loading: true, error: '' });
          try {
            const { user, accessExp } = await userRoute.loginWithEmailCode(email, code);
            set({
              username: user.username,
              displayName: user.displayName,
              accessExp,
              isGuest: user.accountType === 'guest',
              loading: false,
              error: '',
            });
            return true;
          } catch (err: unknown) {
            console.error('Login with email code failed:', err);
            const msgErr = err as { message: string };
            set({ error: msgErr.message, loading: false });
            return false;
          }
        },
        loginWithPassword: async (email: string, password: string) => {
          set({ loading: true, error: '' });
          try {
            const { user, accessExp } = await userRoute.loginWithPassword(email, password);
            set({
              username: user.username,
              displayName: user.displayName,
              accessExp,
              isGuest: user.accountType === 'guest',
              loading: false,
              error: '',
            });
            return true;
          } catch (err: unknown) {
            console.error('Login with password failed:', err);
            const msgErr = err as { message: string };
            set({ error: msgErr.message, loading: false });
            return false;
          }
        },
        logout: async () => {
          set({ loading: true, error: '' });
          try {
            await userRoute.logout();
            set({ ...blankUser });
          } catch (err: unknown) {
            console.error('userstore logout err ', err);
            const msgErr = err as { message: string };
            set({ error: msgErr.message, loading: false });
          }
        },
        refresh: async () => {
          try {
            const { user, accessExp } = await userRoute.refresh();
            set({
              username: user.username,
              displayName: user.displayName,
              accessExp,
              isGuest: user.accountType === 'guest',
              error: '',
            });
            console.debug('Refreshed access token');
            return true;
          } catch (err: unknown) {
            console.error('userstore refresh err ', err);
            set({ ...blankUser });
            return false;
          }
        },
        clearError: () => set({ error: '' }),
        accessValid: () => {
          const { accessExp } = get();
          return accessExp > Date.now();
        },
      };
    },
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useUserStore;
