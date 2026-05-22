/*
 * @Author: TuXunJia
 * @Date: 2026-05-19 17:08:49
 * @LastEditors: TuXunJia
 * @LastEditTime: 2026-05-22 16:58:52
 */
import type { IMobileUser } from '@/types';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useUserStore = defineStore(
  'user',
  () => {
    const user = ref<IMobileUser | null>(null);
    const isLoggedIn = computed(() => !!user.value);

    const setUser = (newUser: IMobileUser): void => {
      user.value = newUser;
    };

    const logout = (): void => {
      user.value = null;
    };
    return { user, isLoggedIn, logout, setUser };
  },
  {
    // persist: true,
    persist: {
      debug: true,
      //   pick: ['user.token'],
      pick: ['user'],
      beforeHydrate(ctx) {
        console.log('beforeHydrate:', ctx);
      },
      afterHydrate(ctx) {
        ctx.store.user.token = 1;
        console.log('afterHydrate:', ctx.store.user);
      },
    },
  },
);
