import api from '@/lib/api';
import { AuthResponse } from '@/types/authTypes';

const useUserRoute = () => {
  const registerAsGuest = async (displayName: string): Promise<AuthResponse> => {
    const res = await api.postJson('/auth/guest', { 
      username: `guest_${Math.random().toString(36).substring(2, 10)}`,
      displayName 
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to register as guest');
    }
    return res.json();
  };

  const requestEmailCode = async (email: string): Promise<void> => {
    const res = await api.postJson('/auth/email/code', { email });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send verification code');
    }
  };

  const loginWithEmailCode = async (email: string, code: string): Promise<AuthResponse> => {
    const res = await api.postJson('/auth/email/login', { email, code });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  };

  const loginWithPassword = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.postJson('/auth/login', { email, password });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  };

  const logout = async (): Promise<void> => {
    const res = await api.postJson('/auth/logout', {});
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Logout failed');
    }
  };

  const refresh = async (): Promise<AuthResponse> => {
    const res = await api.postJson('/auth/refresh', {});
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to refresh token');
    }
    return res.json();
  };

  return {
    registerAsGuest,
    requestEmailCode,
    loginWithEmailCode,
    loginWithPassword,
    logout,
    refresh,
  };
};

export default useUserRoute;
