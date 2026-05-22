import type { AxiosError, AxiosResponse } from 'axios';
import axios from 'axios';
import { showToast } from 'vant';

let isRefreshing = false;
// retryQueue: Array<() => void> — token refresh queue, add back when needed

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
});

// ─── 请求拦截 ───
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── 响应拦截 ───
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, data, message } = response.data;

    if (code === 0) {
      return data;
    }

    handleBusinessError(code, message);
    return Promise.reject(new Error(message));
  },
  (error: AxiosError) => {
    if (!navigator.onLine) {
      showToast('网络已断开，请检查网络连接');
      return Promise.reject(error);
    }

    if (error.response) {
      const { status } = error.response;
      handleHttpError(status);
    } else {
      showToast('请求超时，请稍后重试');
    }

    return Promise.reject(error);
  },
);

function handleHttpError(status: number): void {
  const messages: Record<number, string> = {
    401: '登录已过期，请重新登录',
    403: '没有权限访问',
    404: '请求资源不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
  };

  if (status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      // TODO: 跳转登录页
      isRefreshing = false;
    }
    return;
  }

  showToast(messages[status] || `请求失败 (${status})`);
}

function handleBusinessError(code: number, message: string): void {
  showToast(message || `操作失败 (${code})`);
}

export const get = <T>(url: string, params?: object): Promise<T> => instance.get(url, { params });

export const post = <T>(url: string, data?: object): Promise<T> => instance.post(url, data);

export const put = <T>(url: string, data?: object): Promise<T> => instance.put(url, data);

export const del = <T>(url: string, params?: object): Promise<T> =>
  instance.delete(url, { params });

export default instance;
