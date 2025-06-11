
export interface RegisterSuccessResponse {
  message: string;
  username: string;
  displayname: string;
}

export interface LoginSuccessResponse {
  message: string;
  username: string;
  displayname: string;
  accessExpires: number;
  refreshExpires: number;
}

export interface RefreshSuccessResponse {
  message: string;
  accessExpires: number;
  refreshExpires: number;
}