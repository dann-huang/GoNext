import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api'
import { LoginSuccessResponse, RefreshSuccessResponse, RegisterSuccessResponse } from '@/types/authTypes';
import { REFRESH_BEFORE } from '@/config/consts';

const refreshDependents = new Set<string>();
let refreshTimeout: NodeJS.Timeout | null = null;

const scheduleRefresh = (get: () => UserState) => {
  if (refreshTimeout) clearTimeout(refreshTimeout);
  if (refreshDependents.size === 0) {
    refreshTimeout = null;
    return;
  }
  const { accessExp, refresh } = get();

  const delay = Math.max(accessExp - REFRESH_BEFORE - Date.now(), 0);
  refreshTimeout = setTimeout(refresh, delay);
};

interface UserState {
  username: string;
  displayName: string;
  loading: boolean;
  accessExp: number;
  refreshExp: number;
  error: string;
  register: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  loggedin: () => boolean;
  addRefreshDependent: (id: string) => void;
  removeRefreshDependent: (id: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      username: '',
      displayName: '',
      loading: false,
      accessExp: 0,
      refreshExp: 0,
      error: '',

      register: async (username: string, password: string) => {
        set({ loading: true, error: '' })
        try {
          const res = await api.postJson('/auth/register', { username, password });
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.message)
          }
          const json: RegisterSuccessResponse = await res.json();
          set({ username: json.username, loading: false, })
        } catch (err: unknown) {
          console.error("userstore register err ", err)
          const msgErr = err as { message: string }
          set({ error: msgErr.message, loading: false })
        }
      },
      login: async (username: string, password: string) => {
        set({ loading: true, error: '' })
        try {
          const res = await api.postJson('/auth/login', { username, password });
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.message)
          }
          const json: LoginSuccessResponse = await res.json();
          set({
            username: json.username,
            displayName: json.displayname,
            loading: false,
            accessExp: json.accessExpires,
            refreshExp: json.refreshExpires,
          })
        } catch (err: unknown) {
          console.error("userstore login err ", err)
          const msgErr = err as { message: string }
          set({ error: msgErr.message, loading: false })
        }
      },
      logout: async () => {
        set({ loading: true, error: '' })
        try {
          const res = await api.postJson('/auth/logout', {});
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.message)
          }
          set({ username: '', displayName: '', loading: false, accessExp: 0, refreshExp: 0 })
        } catch (err: unknown) {
          console.error("userstore logout err ", err)
          const msgErr = err as { message: string }
          set({ error: msgErr.message, loading: false })
        }
      },
      refresh: async () => {
        const { refreshExp }: UserState = get();
        if (refreshExp <= Date.now()) {
          set({
            username: '', displayName: '', loading: false, accessExp: 0,
            refreshExp: 0, error: "Session expired; Please log in again"
          })
          return false;
        }
        try {
          const res = await api.postJson("/auth/refresh", {})
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.message)
          }
          const json: RefreshSuccessResponse = await res.json();
          set({ accessExp: json.accessExpires, refreshExp: json.refreshExpires, error: "" })
          scheduleRefresh(get);
          console.debug("Refreshed access token")
          return true;
        } catch (err: unknown) {
          console.error("userstore refresh err ", err)
          if (refreshTimeout) clearTimeout(refreshTimeout);
          return false;
        }
      },
      loggedin: () => get().accessExp > Date.now(),
      addRefreshDependent: (id: string) => {
        refreshDependents.add(id);
        scheduleRefresh(get);
      },
      removeRefreshDependent: (id: string) => {
        refreshDependents.delete(id);
        if (refreshDependents.size === 0 && refreshTimeout) {
          clearTimeout(refreshTimeout);
          refreshTimeout = null;
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);