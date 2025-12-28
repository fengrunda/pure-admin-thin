import { http } from "@/utils/http";
import { formatToken } from "@/utils/auth";

export type RemoteLoginUser = {
  id?: string;
  email?: string;
  username?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role?: string;
  tenant_id?: number | null;
  status?: number;
  is_active?: boolean;
  is_superuser?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RemoteLoginResponse = {
  status: string;
  message: string;
  user?: RemoteLoginUser | null;
  token?: string | null;
  is_new_user?: boolean;
};

export type JwtLoginResponse = {
  access_token?: string;
  token_type?: string;
  expires?: number;
};

export type RemoteLoginRequest = {
  username: string;
  password: string;
};

/** jyh登录 */
export const getJYHLogin = (data?: RemoteLoginRequest) => {
  const params = new URLSearchParams();
  if (data?.username) params.append("username", data.username);
  if (data?.password) params.append("password", data.password);
  return http.request<RemoteLoginResponse>({
    method: "post",
    url: "/api/jyh/remote-login",
    data: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    skipAuth: true
  });
};

/** 登录 */
export const getLogin = (data?: RemoteLoginRequest) => {
  const params = new URLSearchParams();
  if (data?.username) params.append("username", data.username);
  if (data?.password) params.append("password", data.password);
  return http.request<JwtLoginResponse>({
    method: "post",
    url: "/auth/jwt/login",
    data: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    skipAuth: true
  });
};

/** 获取用户信息 */
export const getUserInfo = (token?: string) => {
  return http.request<RemoteLoginUser>({
    method: "get",
    url: "/users/me",
    headers: token ? { Authorization: formatToken(token) } : undefined
  });
};
