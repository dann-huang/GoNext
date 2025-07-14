export interface UserInfo {
  username: string;
  displayName: string;
  accountType: string;
}

export interface AuthResponse {
  user: UserInfo;
  accessExp: number;
}

export interface GuestRequest {
  name: string;
}

export interface SetEmailRequest {
  email: string;
}

export interface VerifyEmailRequest {
  code: string;
}

export interface EmailLoginRequest {
  email: string;
  code: string;
}

export interface PassRequest {
  pass: string;
  code: string;
}

export interface PassLoginRequest {
  email: string;
  pass: string;
}
