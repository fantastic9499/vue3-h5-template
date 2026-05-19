import type { Router } from 'vue-router';
import { useUserStore } from '@/stores/user';

export function setupRouterGuard(router: Router): void {
  router.beforeEach((to, _from, next) => {
    if (to.meta.title) {
      document.title = to.meta.title;
    }

    const userStore = useUserStore();
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }

    next();
  });
}
