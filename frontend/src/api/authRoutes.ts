import api from '@/lib/api';
import {
  AuthResponse,
  GuestRequest,
  SetEmailRequest,
  VerifyEmailRequest,
  EmailLoginRequest,
  PassLoginRequest,
  PassRequest,
} from '@/types/authTypes';

const useUserRoute = () => {
  const registerGuest = async (name: string): Promise<AuthResponse> => {
    return api.postJson<AuthResponse, GuestRequest>('/auth/guest', { name });
  };
  const logout = async (): Promise<void> => {
    await api.postJson('/auth/logout', {});
  };
  const refreshAccess = async (): Promise<AuthResponse> => {
    return api.postJson<AuthResponse>('/auth/refresh', {});
  };

  const setEmail = async (email: string): Promise<void> => {
    await api.postJson<void, SetEmailRequest>('/auth/email/setup', { email });
  };
  const verifyEmail = async (code: string): Promise<AuthResponse> => {
    return api.postJson<AuthResponse, VerifyEmailRequest>(
      '/auth/email/verify',
      { code }
    );
  };
  const getPassCode = async (): Promise<void> => {
    await api.postJson('/auth/pass/request', {});
  };
  const setPass = async (
    password: string,
    code: string
  ): Promise<AuthResponse> => {
    return api.postJson<AuthResponse, PassRequest>('/auth/pass/set', {
      pass: password,
      code,
    });
  };

  const getLoginCode = async (email: string): Promise<void> => {
    await api.postJson<void, SetEmailRequest>('/auth/login/getCode', { email });
  };
  const loginWithCode = async (
    email: string,
    code: string
  ): Promise<AuthResponse> => {
    return api.postJson<AuthResponse, EmailLoginRequest>(
      '/auth/login/useCode',
      { email, code }
    );
  };

  const loginWithPassword = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    return api.postJson<AuthResponse, PassLoginRequest>(
      '/auth/login/password',
      { email, pass: password }
    );
  };

  return {
    registerGuest,
    logout,
    refreshAccess,
    setEmail,
    verifyEmail,
    getPassCode,
    setPass,
    getLoginCode,
    loginWithCode,
    loginWithPassword,
  };
};

export default useUserRoute;
