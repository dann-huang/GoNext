import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import getAuthRoutes from '../api/authRoutes';
import { UserInfo } from '@/types/authTypes';

interface UserState extends UserInfo {
  accessExp: number;

  guestLogin: (displayName: string) => Promise<null | Error>;

  logout: () => void;
  refresh: () => Promise<boolean>;

  accessValid: () => boolean;
}

const blankUser = {
  username: '',
  displayName: '',
  accountType: '',
  accessExp: 0,
};

const authRoutes = getAuthRoutes();

const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      return {
        ...blankUser,
        guestLogin: async (name: string) => {
          try {
            const { user, accessExp } = await authRoutes.registerGuest(name);
            set({
              username: user.username,
              displayName: user.displayName,
              accountType: user.accountType,
              accessExp,
            });
            return null;
          } catch (error) {
            console.warn('guestLogin err', error);
            if (error instanceof Error) {
              return error;
            }
            return new Error(String(error));
          }
        },
        logout: () => {
          set({ ...blankUser });
          authRoutes.logout().catch((err) => {
            console.error('logout err ', err);
          });
        },
        refresh: async () => {
          try {
            const { user, accessExp } = await authRoutes.refreshAccess();
            set({
              username: user.username,
              displayName: user.displayName,
              accountType: user.accountType,
              accessExp,
            });
            return true;
          } catch (error) {
            console.warn('refresh err', error);
            return false;
          }
        },
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
