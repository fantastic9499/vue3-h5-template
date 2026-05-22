/*
 * @Author: TuXunJia
 * @Date: 2026-05-20 18:52:52
 * @LastEditors: TuXunJia
 * @LastEditTime: 2026-05-20 19:14:23
 */
import type { IMobileUser } from '@/types';
import { get } from './axiosRequest';

export const login = (staffCode: string) =>
  get<IMobileUser>(
    `https://bdrpt-te.yfdyf.com/yf-data-portal/portal/login/mobileLogin?empNum=${staffCode}&tempCode=IZXuNNvEnWZB9sGX`,
  );
