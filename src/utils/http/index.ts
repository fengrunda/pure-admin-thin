import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  PureHttpResponse,
  PureHttpRequestConfig,
  PureHttpInstance
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_AXIOS_BASE_URL ?? undefined,
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

/** 创建并配置 axios 实例 */
const axiosInstance: AxiosInstance = Axios.create(defaultConfig);

/** 请求拦截 */
axiosInstance.interceptors.request.use(
  async (config: PureHttpRequestConfig): Promise<any> => {
    const skipAuthUrls: string[] = [];
    const shouldSkipAuth =
      config.skipAuth ||
      (config.url &&
        skipAuthUrls.length > 0 &&
        skipAuthUrls.some(url => config.url.endsWith(url)));

    if (shouldSkipAuth) {
      return config;
    }

    return new Promise(resolve => {
      const data = getToken();
      if (data?.accessToken) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: formatToken(data.accessToken)
        };
      }
      resolve(config);
    });
  },
  error => {
    return Promise.reject(error);
  }
);

/** 响应拦截 */
axiosInstance.interceptors.response.use(
  (response: PureHttpResponse) => {
    return response.data;
  },
  (error: PureHttpError) => {
    const $error = error;
    $error.isCancelRequest = Axios.isCancel($error);
    const status = $error?.response?.status;
    if (status === 401) {
      // 未授权统一登出并跳转登录
      useUserStoreHook().logOut();
    }
    return Promise.reject($error);
  }
);

export const http = axiosInstance as PureHttpInstance;
