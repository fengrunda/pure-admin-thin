import type {
  Method,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
  AxiosInstance
} from "axios";

export type resultType = {
  accessToken?: string;
};

export type RequestMethods = Extract<
  Method,
  "get" | "post" | "put" | "delete" | "patch" | "option" | "head"
>;

export interface PureHttpError extends AxiosError {
  isCancelRequest?: boolean;
}

export interface PureHttpResponse extends AxiosResponse {
  config: PureHttpRequestConfig;
}

export interface PureHttpRequestConfig extends AxiosRequestConfig {
  beforeRequestCallback?: (request: PureHttpRequestConfig) => void;
  beforeResponseCallback?: (response: PureHttpResponse) => void;
  skipAuth?: boolean;
  skipAuthUrls?: string[];
}

export interface ResponseData<T = any> {
  status: string;
  count?: number;
  data: T;
  [key: string]: any;
}

export interface PureHttpInstance extends AxiosInstance {
  request<T = any>(config: PureHttpRequestConfig): Promise<T>;
  get<T = any>(url: string, config?: PureHttpRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: PureHttpRequestConfig): Promise<T>;
  head<T = any>(url: string, config?: PureHttpRequestConfig): Promise<T>;
  options<T = any>(url: string, config?: PureHttpRequestConfig): Promise<T>;
  post<T = any>(
    url: string,
    data?: any,
    config?: PureHttpRequestConfig
  ): Promise<T>;
  put<T = any>(
    url: string,
    data?: any,
    config?: PureHttpRequestConfig
  ): Promise<T>;
  patch<T = any>(
    url: string,
    data?: any,
    config?: PureHttpRequestConfig
  ): Promise<T>;
}
