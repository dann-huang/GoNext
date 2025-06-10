
export interface RegisterSuccessResponse {
  message: string;
  username: string;
  displayname: string;
}

export interface LoginSuccessResponse {
  message: string;
  username: string;
  displayname: string;
  accessExpire: number;
  refreshExpire: number;
}

export interface RefreshSuccessResponse {
  message: string;
  accessExpire: number;
  refreshExpire: number;
}