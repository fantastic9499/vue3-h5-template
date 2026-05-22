/*
 * @Author: TuXunJia
 * @Date: 2026-05-20 15:56:13
 * @LastEditors: TuXunJia
 * @LastEditTime: 2026-05-20 16:48:38
 */
import { hideLoading, showLoading } from '@/utils/toast';
import { axiosRequestAdapter } from '@alova/adapter-axios';
import { createAlova } from 'alova';
import VueHook from 'alova/vue';

export const alovaInstance = createAlova({
  // 核心：绑定 Vue 响应式适配器
  statesHook: VueHook,

  // 指定请求适配器（这里使用 Axios 发送请求）
  requestAdapter: axiosRequestAdapter(),

  // 全局基础路径
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',

  // 请求拦截器
  beforeRequest(method) {
    showLoading();
    const token = localStorage.getItem('token');
    if (token) {
      method.config.headers.Authorization = `Bearer ${token}`;
    }
  },

  // 响应拦截器（统一处理业务状态码）
  responded: {
    onSuccess(response) {
      const json = response.data;
      hideLoading();
      if (json.code === 200) {
        return json.data;
      }
      throw new Error(json.message || '请求失败');
    },
    onError(error) {
      hideLoading();
      console.error('全局错误处理:', error);
      throw error;
    },
  },
});
