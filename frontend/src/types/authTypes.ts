
export interface UserInfo {
  username: string;
  displayName: string;
  accountType: string;
}

export interface AuthResponse {
  user: UserInfo;
  accessExp: number;
}
