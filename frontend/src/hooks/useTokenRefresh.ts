import { useEffect } from 'react';
import useUserStore from './useUserStore';
import { REFRESH_BEFORE } from '@/config/consts';

const refreshDependents = new WeakMap<object, boolean>();
let refreshTimeout: NodeJS.Timeout | null = null;

const scheduleRefresh = (refresh: () => Promise<boolean>) => {
  if (refreshTimeout) clearTimeout(refreshTimeout);
  const { accessExp } = useUserStore.getState();
  const now = Date.now();

  if (Object.keys(refreshDependents).length === 0 || accessExp <= now) {
    refreshTimeout = null;
    return;
  }

  const timeUntilRefresh = Math.max(accessExp - REFRESH_BEFORE - now, 0);
  refreshTimeout = setTimeout(async () => {
    const success = await refresh();
    if (success) scheduleRefresh(refresh);
  }, timeUntilRefresh);
};

export const useTokenRefresh = (dependency: object) => {
  const { refresh, accessValid } = useUserStore((state) => state);

  useEffect(() => {
    refreshDependents.set(dependency, true);
    scheduleRefresh(refresh);

    return () => {
      refreshDependents.delete(dependency);
      scheduleRefresh(refresh);
    };
  }, [dependency, refresh]);

  return accessValid();
};
