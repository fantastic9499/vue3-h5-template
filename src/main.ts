import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createRouter, createWebHashHistory } from 'vue-router';
import { routes } from '@/router';
import { setupRouterGuard } from '@/router/guard';
import App from './App.vue';
import '@/styles/reset.less';
import '@/styles/global.less';
import '@/styles/theme.less';

const app = createApp(App);

// ─── Pinia + 持久化插件 ───
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

// ─── Vue Router（Hash 模式） ───
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
app.use(router);

// ─── 路由守卫 ───
setupRouterGuard(router);

app.mount('#app');
