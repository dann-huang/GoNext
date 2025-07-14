import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import getAuthRoutes from '../api/authRoutes';
import { UserInfo } from '@/types/authTypes';

interface UserState extends UserInfo {
  accessExp: number;
  error: string;
  loading: boolean;

  guestLogin: (displayName: string) => Promise<boolean>;

  logout: () => void;
  refresh: () => Promise<boolean>;

  clearError: () => void;
  accessValid: () => boolean;
}

const blankUser = {
  username: '',
  displayName: '',
  accountType: '',
  accessExp: 0,
  error: '',
  loading: false,
};

const authRoutes = getAuthRoutes();

const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      return {
        ...blankUser,
        guestLogin: async (name: string) => {
          set({ loading: true, error: '' });
          try {
            const { user, accessExp } = await authRoutes.registerGuest(name);
            set({
              username: user.username,
              displayName: user.displayName,
              accountType: user.accountType,
              accessExp,
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
        logout: () => {
          set({ ...blankUser, loading: false, error: '' });
          authRoutes.logout().catch((e) => {
            console.error('userstore logout err ', e);
          });
        },
        refresh: async () => {
          set({ loading: true, error: '' });
          try {
            const { user, accessExp } = await authRoutes.refreshAccess();
            set({
              username: user.username,
              displayName: user.displayName,
              accountType: user.accountType,
              accessExp,
              loading: false,
              error: '',
            });
            return true;
          } catch (err: unknown) {
            console.error('userstore refresh err ', err);
            const msgErr = err as { message: string };
            set({ error: msgErr.message, loading: false });
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
