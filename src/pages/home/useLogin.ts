/*
 * @Author: TuXunJia
 * @Date: 2026-05-20 18:55:25
 * @LastEditors: TuXunJia
 * @LastEditTime: 2026-05-22 17:08:04
 */
import * as services from '@/api/demo';
import { useUserStore } from '@/stores/user';
import { showToast } from 'vant';
import { useRequest } from 'vue-request';

export const useLogin = () => {
  const userStore = useUserStore();
  const {
    run: login,
    data,
    loading,
  } = useRequest(
    async (staffCode) => {
      const user = await services.login(staffCode);
      showToast(user.token);
      userStore.setUser(user);
      return user;
    },
    { manual: true, onError: (e) => showToast(e.message || '登录失败') },
  );

  onMounted(() => {
    login('00117491');
  });

  return { user: data, loading, login };
};
