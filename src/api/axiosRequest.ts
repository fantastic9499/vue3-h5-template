import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';
import { showToast } from 'vant';

interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

interface RequestConfig extends AxiosRequestConfig {
  skipErrorHandler?: boolean;
}

let isRefreshing = false;
let retryQueue: Array<(token: string) => void> = [];

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { code, data, message } = response.data;

      if (code === 200) {
        return data as unknown as AxiosResponse;
      }

      if (code === 401) {
        handleTokenExpired(instance);
        return Promise.reject(new Error(message));
      }

      showToast(message || `操作失败 (${code})`);
      return Promise.reject(new Error(message));
    },
    (error: AxiosError) => {
      if (!navigator.onLine) {
        showToast('网络已断开，请检查网络连接');
        return Promise.reject(error);
      }

      if (error.response) {
        handleHttpError(error.response.status);
      } else if (error.code === 'ECONNABORTED') {
        showToast('请求超时，请稍后重试');
      } else {
        showToast('网络异常，请稍后重试');
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

function handleTokenExpired(instance: AxiosInstance): void {
  if (!isRefreshing) {
    isRefreshing = true;
    // TODO: implement token refresh logic
    // refreshToken().then((newToken) => {
    //   localStorage.setItem('token', newToken);
    //   retryQueue.forEach((cb) => cb(newToken));
    //   retryQueue = [];
    // }).catch(() => {
    //   retryQueue = [];
    //   // router.push('/login');
    // }).finally(() => {
    //   isRefreshing = false;
    // });
    isRefreshing = false;
  }

  return new Promise((resolve) => {
    retryQueue.push((token: string) => {
      instance.defaults.headers.common.Authorization = `Bearer ${token}`;
      resolve(undefined);
    });
  }) as never;
}

const httpStatusMessages: Record<number, string> = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '没有权限访问',
  404: '请求资源不存在',
  405: '请求方法不允许',
  408: '请求超时',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
};

function handleHttpError(status: number): void {
  const message = httpStatusMessages[status] || `请求失败 (${status})`;
  showToast(message);
}

const axiosInstance = createAxiosInstance();

export function get<T>(url: string, params?: object, config?: RequestConfig): Promise<T> {
  return axiosInstance.get(url, { params, ...config });
}

export function post<T>(url: string, data?: object, config?: RequestConfig): Promise<T> {
  return axiosInstance.post(url, data, config);
}

export function put<T>(url: string, data?: object, config?: RequestConfig): Promise<T> {
  return axiosInstance.put(url, data, config);
}

export function del<T>(url: string, params?: object, config?: RequestConfig): Promise<T> {
  return axiosInstance.delete(url, { params, ...config });
}

export default axiosInstance;
