import { get, post } from './request';
import type { IUser, ILoginParams, ILoginResult } from '@/types';

export const userApi = {
  /** 登录 */
  login: (params: ILoginParams) => post<ILoginResult>('/auth/login', params),
  /** 获取用户信息 */
  fetchUser: (id: string) => get<IUser>(`/user/${id}`),
  /** 更新用户信息 */
  updateUser: (id: string, data: Partial<IUser>) => put<IUser>(`/user/${id}`, data),
};
