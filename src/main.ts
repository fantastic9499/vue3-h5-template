import { routes } from '@/router';
import { setupRouterGuard } from '@/router/guard';
import '@/styles/global.less';
import '@/styles/reset.less';
import '@/styles/theme.less';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import 'vant/lib/toast/style';
import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';

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
