import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题，用于 document.title 和守卫中设置 */
    title?: string;
    /** 是否需要登录态 */
    requiresAuth?: boolean;
    /** 是否启用 KeepAlive 缓存 */
    keepAlive?: boolean;
  }
}
