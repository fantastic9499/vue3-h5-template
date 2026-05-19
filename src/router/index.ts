import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'HomePage',
        component: () => import('@/pages/home/index.vue'),
        meta: { title: '首页', keepAlive: true },
      },
      {
        path: 'user/profile',
        name: 'UserProfile',
        component: () => import('@/pages/user/profile.vue'),
        meta: { title: '个人中心', requiresAuth: true },
      },
      {
        path: '404',
        name: 'NotFound',
        component: () => import('@/pages/404.vue'),
        meta: { title: '页面不存在' },
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: '/404',
      },
    ],
  },
];
