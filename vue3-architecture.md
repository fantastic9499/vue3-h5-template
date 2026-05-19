# Vue 3 移动端 H5 脚手架核心考量（v4）

> **铁律**：全部代码严格使用 TypeScript，禁止 `any`，禁止 `.js` 业务文件。所有组件使用 `<script setup lang="ts">`，Composables / Store / 工具函数一律 `.ts`。

## 1. 工程构建

| 维度 | 选型建议 | 理由 |
|------|---------|------|
| 构建工具 | **Vite 8** (Rolldown 默认启用) | Rust 驱动的统一打包器，构建速度提升 10-30 倍 |
| 包管理 | **pnpm** | 节省磁盘、幽灵依赖隔离 |
| TS | **TypeScript 5.x** | 类型安全，`vue-tsc` 做模板类型检查 |
| 代码规范 | ESLint v9 + Prettier v3 + husky + lint-staged | 提交门禁 |

### 项目目录结构

```
project/
├── public/                      // 静态资源（不经过构建处理）
│   └── favicon.ico
├── src/
│   ├── api/                     // 接口定义（按模块拆分）
│   │   ├── request.ts           // Axios 实例 + 拦截器
│   │   ├── user.ts              // 用户相关接口
│   │   └── order.ts             // 订单相关接口
│   ├── assets/                  // 需要构建处理的静态资源（图片、字体）
│   ├── components/              // 全局公共组件
│   │   ├── ErrorBoundary/
│   │   ├── OptImage/
│   │   └── AppSkeleton/
│   ├── composables/             // 业务专用 Composables（通用能力优先用 @vueuse/core）
│   │   ├── usePullRefresh.ts
│   │   └── useInfiniteScroll.ts
│   ├── config/                  // 应用配置
│   │   └── env.ts               // 环境变量导出
│   ├── layouts/                 // 布局组件
│   │   └── AppLayout.vue        // 根布局（Suspense + ErrorBoundary + RouterView）
│   ├── pages/                   // 页面组件（按路由结构组织）
│   │   ├── home/
│   │   │   └── index.vue
│   │   ├── user/
│   │   │   └── profile.vue
│   │   └── 404.vue
│   ├── router/                  // 路由配置
│   │   └── index.ts             // 路由表 + 守卫
│   ├── stores/                  // Pinia Store
│   │   ├── counter.ts           // 计数器 Store（示例）
│   │   ├── user.ts              // 用户 Store
│   │   ├── app.ts               // 全局 UI 状态 Store
│   │   └── modules/             // 业务模块 Store
│   │       ├── cart.ts
│   │       └── order.ts
│   ├── styles/                  // 全局样式
│   │   ├── variables.less       // Less 变量
│   │   ├── mixins.less          // Less mixins
│   │   ├── theme.less           // 主题（Vant CSS Variables 联动）
│   │   ├── reset.less           // 样式重置
│   │   ├── global.less          // 全局样式
│   │   └── animations.less      // 公共动画
│   ├── types/                   // 全局类型定义
│   │   └── index.d.ts           // 通用类型（User、API 响应等）
│   ├── utils/                   // 工具函数
│   │   └── storage.ts           // localStorage 封装
│   ├── App.vue                  // 应用根组件
│   ├── env.d.ts                 // 环境变量类型声明
│   └── main.ts                  // 渲染入口
├── .browserslistrc
├── .env.development
├── .env.staging
├── .env.production
├── commitlint.config.ts
├── eslint.config.ts
├── index.html
├── package.json
├── pnpm-lock.yaml
├── postcss.config.ts
├── .prettierrc.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

### 应用入口

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from '@/router'
import App from './App.vue'
import '@/styles/reset.less'
import '@/styles/global.less'
import '@/styles/theme.less'

const app = createApp(App)

// ─── Pinia + 持久化插件 ───
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// ─── Vue Router（Hash 模式） ───
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
app.use(router)

app.mount('#app')
```

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { onErrorCaptured, onUnmounted, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAppStore } from '@/stores/app'

// Pinia persist 插件自动恢复登录态，无需手动 restoreSession
const appStore = useAppStore()

// ─── 应用初始化 ───
// 1. 检测运行环境（微信/支付宝/浏览器）
appStore.detectEnvironment()

// 2. 全局错误监听（务必在 onUnmounted 中清理）
const globalError = ref<Error | null>(null)

const onGlobalError = (event: ErrorEvent): void => {
  console.error('[GlobalError]', event.message, event.filename, event.lineno)
  // TODO: 上报到监控平台
}

const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
  console.error('[UnhandledRejection]', event.reason)
  // TODO: 上报到监控平台
}

window.addEventListener('error', onGlobalError)
window.addEventListener('unhandledrejection', onUnhandledRejection)

onUnmounted(() => {
  window.removeEventListener('error', onGlobalError)
  window.removeEventListener('unhandledrejection', onUnhandledRejection)
})

// 3. 捕获子组件渲染错误
onErrorCaptured((err) => {
  console.error('[ErrorCaptured]', err)
  globalError.value = err
  return false // 阻止错误继续向上传播
})
</script>

<template>
  <AppLayout />
</template>
```

**插件注册顺序**（对应原 React Provider 嵌套）：

| 顺序 | 插件 | 职责 |
|------|------|------|
| 1 | `pinia` + `persistedstate` | 全局状态管理 + 自动持久化，`useXxxStore()` 需要 |
| 2 | `router` | 路由上下文，`<RouterView>` / `useRouter()` 需要 |

### tsconfig.json

启用严格模式，最大化 TypeScript 类型保护：

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

> `noUncheckedIndexedAccess`：数组/对象索引访问返回 `T | undefined`，防止越界访问崩溃。
> `noImplicitOverride`：子类重写父类方法必须加 `override` 关键字，避免方法名拼错无提示。
> `verbatimModuleSyntax`：强制 `import type` 语法，确保类型导入被正确擦除。

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

#### Vue 文件类型声明

```ts
// src/env.d.ts（或单独建 src/types/shims-vue.d.ts）
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
```

> `unplugin-auto-import` 会自动生成 `src/auto-imports.d.ts`，需确保 `tsconfig.json` 的 `include` 包含 `"src/**/*.d.ts"`（已包含）。

## 2. 组件规范 —— `<script setup lang="ts">` 单文件组件

> **铁律**：所有组件和页面统一使用 `<script setup lang="ts">` + Composition API。**禁止**使用 Options API，**禁止**使用 `defineComponent()` 对象写法，**禁止**在 `.vue` 文件的 `<script>` 中不加 `lang="ts"`。所有 `.ts` 文件严格 TypeScript，**禁止** `any`。

```vue
<!-- ✅ 正确：<script setup lang="ts"> + Composition API -->
<script setup lang="ts">
import { useRequest } from 'vue-request'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'

interface IProps {
  userId: string
}

const props = defineProps<IProps>()
const userStore = useUserStore()

const { data: user, loading } = useRequest(() => userApi.fetchUser(props.userId))
</script>

<template>
  <div v-if="loading">加载中...</div>
  <div v-else>{{ user?.name }}</div>
</template>
```

```vue
<!-- ❌ 禁止：Options API -->
<script>
export default {
  data() { return { name: '' } },
  methods: { ... }
}
</script>

<!-- ❌ 禁止：缺少 lang="ts" -->
<script setup>
// 没有 TypeScript
</script>
```

```vue
<!-- ✅ 标准写法：完整组件示例 -->
<script setup lang="ts">
import { useRequest } from 'vue-request'
import { userApi } from '@/api/user'

interface IProps {
  userId: string
}

const props = defineProps<IProps>()

const { data: user, loading } = useRequest(
  () => userApi.fetchUser(props.userId),
  { refreshDeps: [() => props.userId] }
)
</script>

<template>
  <van-skeleton v-if="loading" :row="3" />
  <div v-else class="user-card">
    {{ user?.name }}
  </div>
</template>
```

**Composable 抽取原则**：

- 组件内逻辑超过 3 个 `ref`/`watch`/`computed` 时，按职责拆分 Composable
- 命名语义化：`useAuth`、`useInfiniteScroll`、`usePullRefresh`
- Pinia Store 通过 `useXxxStore()` 使用，天然支持 Vue 响应式，无需额外包装

### 组件目录组织规范

- **组件目录下的组件必须按组件名单独建目录**，不要直接在 `components/` 下平铺 `HomeHeader.vue`、`HomeHeader.module.less`
- **组件目录命名使用组件名本身**，如 `HomeHeader/`、`BottomTabBar/`
- **组件实现文件统一命名为 `index.vue`**
- **组件样式文件统一命名为 `index.module.less`**
- **页面级组件和全局公共组件统一遵守这套目录组织方式**

推荐结构：

```text
src/pages/home/components/
├── HomeHeader/
│   ├── index.vue
│   └── index.module.less
├── MyAppsSection/
│   ├── index.vue
│   └── index.module.less
└── BottomTabBar/
    ├── index.vue
    └── index.module.less
```

```text
src/components/
└── AppSkeleton/
    ├── index.vue
    └── index.module.less
```

### TypeScript 接口命名规范

- **所有接口定义必须以大写字母 `I` 开头**
- 接口名采用 `I + 语义化 PascalCase` 形式命名
- 该规范适用于页面专属类型、公共类型、接口响应类型、组件 Props 接口等所有 `interface`

```ts
// ✅ 正确
interface IHomeHeaderData {
  userName: string
  avatar?: string
  dateText: string
}

interface IHomeHeaderProps {
  data: IHomeHeaderData
}

// ❌ 错误
interface HomeHeaderData {
  userName: string
}
```

### 事件函数命名规范

- **所有点击事件和交互事件对应函数必须以 `on` 开头命名**
- **绝对禁止** 使用 `handle` 前缀命名事件函数
- 该规范适用于页面内事件函数、组件 emit 事件、列表项点击事件、底部导航切换事件等场景

```ts
// ✅ 正确
const onShortcutClick = (key: AppShortcutKey): void => {}
const onNoticeClick = (): void => {}
const onTabChange = (key: HomeTabKey): void => {}

interface IBottomTabBarEmits {
  (e: 'tabChange', key: HomeTabKey): void
}

// ❌ 错误
const handleShortcutClick = (key: AppShortcutKey): void => {}
const handleTabChange = (key: HomeTabKey): void => {}
```

### Vue 3 Composition API 特性应用

| 特性 | 移动端场景 | 说明 |
|------|-----------|------|
| `Suspense` + `async setup` | 异步数据加载 | 配合 `defineAsyncComponent` 实现代码分割 + 加载态 |
| `defineAsyncComponent` | 路由级/组件级懒加载 | 替代 React.lazy，内置加载/错误/超时状态 |
| `Reactive Props Destructure` | 组件 props 使用 | Vue 3.5+ 解构 props 后仍保持响应式，无需 `props.xxx` |
| `useTemplateRef()` | 模板 Ref 类型安全 | Vue 3.5+ 替代传统 `ref` 绑定，更类型安全 |
| `Teleport` | 弹窗/抽屉/Toast | 将 DOM 渲染到 body 根节点，避免移动端 z-index 层叠问题 |
| `provide/inject` | 跨层级依赖注入 | 替代 React Context，支持 TypeScript 泛型 |
| `defineExpose` | 组件 Ref 暴露方法 | 父组件通过 ref 调用子组件方法 |

```vue
<!-- defineAsyncComponent 示例：路由懒加载 -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const UserDetail = defineAsyncComponent({
  loader: () => import('@/pages/user/detail.vue'),
  loadingComponent: () => import('@/components/AppSkeleton/index.vue'),
  delay: 200,
  timeout: 10000,
})
</script>

<template>
  <Suspense>
    <template #default>
      <UserDetail />
    </template>
    <template #fallback>
      <van-skeleton :row="5" />
    </template>
  </Suspense>
</template>
```

```vue
<!-- Teleport 示例：底部弹窗渲染到 body -->
<script setup lang="ts">
import { ref } from 'vue'

const showPopup = ref(false)
</script>

<template>
  <button @click="showPopup = true">打开弹窗</button>

  <Teleport to="body">
    <van-popup v-model:show="showPopup" position="bottom" :style="{ minHeight: '40%' }">
      <!-- 弹窗内容 -->
    </van-popup>
  </Teleport>
</template>
```

```vue
<!-- Reactive Props Destructure 示例（Vue 3.5+） -->
<script setup lang="ts">
import { useRequest } from 'vue-request'
import { userApi } from '@/api/user'

interface IUserCardProps {
  userId: string
  size?: 'small' | 'large'
}

// Vue 3.5+ 解构后仍保持响应式，直接使用 userId 而非 props.userId
const { userId, size = 'small' } = defineProps<IUserCardProps>()

const { data: user, loading } = useRequest(
  () => userApi.fetchUser(userId),
  { refreshDeps: [() => userId] }
)
</script>

<template>
  <van-skeleton v-if="loading" :row="3" />
  <div v-else :class="[size]">
    {{ user?.name }}
  </div>
</template>
```

```vue
<!-- useTemplateRef 示例（Vue 3.5+） -->
<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'

// 通过字符串参数与 template 中 ref="scrollContainer" 绑定，类型自动推断
const scrollContainer = useTemplateRef<HTMLDivElement>('scrollContainer')

onMounted(() => {
  console.log(scrollContainer.value?.scrollHeight)
})
</script>

<template>
  <div ref="scrollContainer" class="scroll-container">
    <!-- 内容 -->
  </div>
</template>
```

```ts
// provide/inject 示例：带类型的依赖注入
// 提供方
import type { InjectionKey, Ref } from 'vue'

interface IAppConfig {
  theme: Ref<'light' | 'dark'>
  platform: Ref<'wechat' | 'alipay' | 'browser'>
}

const AppConfigKey: InjectionKey<IAppConfig> = Symbol('app-config')

// 在父组件中
provide(AppConfigKey, { theme, platform })

// 在子组件中（自动推断类型）
const config = inject(AppConfigKey)!
```

## 3. 路由方案

- **Vue Router 4** —— Vue 3 官方路由，支持：
  - 嵌套路由、命名路由、动态路由匹配
  - 路由懒加载 `() => import()` 做代码分割
- **使用 `createWebHashHistory`**：移动端 H5 适用哈希路由（`/#/path`），无需服务端配置 fallback，避免分享链接 404
- 路由守卫封装：登录态拦截、权限校验
- 路由缓存（keep-alive）：移动端返回列表页保留滚动位置

### 路由配置

```ts
// src/router/types.ts — 路由元信息类型声明（必须引入到项目才会生效）
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题，用于 document.title 和守卫中设置 */
    title?: string
    /** 是否需要登录态 */
    requiresAuth?: boolean
    /** 是否启用 KeepAlive 缓存 */
    keepAlive?: boolean
  }
}
```

```ts
// src/router/index.ts
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
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
]
```

> `RouteMeta` 类型扩展后，`to.meta.title`、`to.meta.requiresAuth` 等属性自动获得类型提示，无需 `as string` 强制断言。

### 路由守卫

```ts
// src/router/guard.ts
import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'

export function setupRouterGuard(router: Router): void {
  router.beforeEach((to, _from, next) => {
    // 设置页面标题 — RouteMeta 已扩展，无需 as 断言
    if (to.meta.title) {
      document.title = to.meta.title
    }

    // 登录态拦截
    const userStore = useUserStore()
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    next()
  })
}
```

```ts
// main.ts 中注册守卫
import { setupRouterGuard } from '@/router/guard'

setupRouterGuard(router)
```

### 路由缓存（KeepAlive）

> KeepAlive 的 `include` 匹配的是组件的 `name`。使用 `<script setup>` 时，组件名默认从文件名推断（如 `index.vue` → `index`），不够语义化。**需要缓存的页面组件必须通过 `defineOptions({ name: 'xxx' })` 显式声明组件名**。

```vue
<!-- 页面组件示例：声明 name 以配合 KeepAlive -->
<script setup lang="ts">
defineOptions({ name: 'HomePage' })
</script>
```

```vue
<!-- layouts/AppLayout.vue -->
<script setup lang="ts">
import { computed, onErrorCaptured, ref } from 'vue'
import { useRoute } from 'vue-router'

const catchError = ref<Error | null>(null)

onErrorCaptured((err) => {
  catchError.value = err
  return false
})

// ─── KeepAlive 缓存列表管理 ───
// 根据路由 meta.keepAlive 动态收集需要缓存的组件名
// 注意：组件 defineOptions({ name }) 必须与路由 name 一致，KeepAlive 才能匹配
const route = useRoute()

const keepAliveList = computed(() =>
  route.matched
    .filter((r) => r.meta.keepAlive)
    .map((r) => r.name as string)
)
</script>

<template>
  <div v-if="catchError" class="error-wrap">
    <p>页面出了点问题</p>
    <button @click="catchError = null">点击重试</button>
  </div>
  <router-view v-else v-slot="{ Component, route: currentRoute }">
    <transition name="fade" mode="out-in">
      <keep-alive :include="keepAliveList">
        <suspense>
          <template #default>
            <component :is="Component" :key="currentRoute.path" />
          </template>
          <template #fallback>
            <van-skeleton :row="5" />
          </template>
        </suspense>
      </keep-alive>
    </transition>
  </router-view>
</template>
```

## 4. 移动端适配 —— postcss-px-to-viewport-8-plugin

```ts
// postcss.config.ts
import pxToViewport from 'postcss-px-to-viewport-8-plugin'

export default {
  plugins: [
    pxToViewport({
      viewportWidth: 375,              // 设计稿宽度（UI 出稿基准）
      unitPrecision: 5,                // 转换后保留小数位
      viewportUnit: 'vw',              // 目标单位
      selectorBlackList: ['.van'],     // 排除 Vant 类名
      minPixelValue: 1,                // 小于 1px 不转换
      mediaQuery: false,
      exclude: [/node_modules\/vant/],
    })
  ]
}
```

- **viewport meta**：
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  ```
- 1px 边框问题（`transform: scaleY(0.5)`）
- 安全区域适配（iPhone 刘海/底部横条）：`env(safe-area-inset-*)`
- 横屏锁定：CSS `@media (orientation: landscape)` 提示或强制竖屏

## 5. 组件库 & 样式方案 —— Less

### Vant 4

- **按需引入**：Vite 下配合 `@vant/auto-import-resolver` + `unplugin-vue-components` 自动按需引入，无需手动 import
- **主题定制**：CSS Variables 覆盖（`--van-color-primary` 等），运行时动态切换
- **国际化**：全局 `Locale.use('zh-CN')` 设置语言包
- 配合 `postcss-px-to-viewport-8-plugin` 已配置 `exclude` 排除 Vant 样式转换

```ts
// vite.config.ts 中 Vant 按需引入 + API 自动导入
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VantResolver } from '@vant/auto-import-resolver'

export default defineConfig({
  plugins: [
    // Vant 组件按需引入
    Components({
      resolvers: [VantResolver()],
    }),
    // Vue / Vue Router / Pinia / VueUse API 自动导入
    // 无需在每个文件中手动 import { ref, computed, useRouter } from 'vue'
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      dts: 'src/auto-imports.d.ts',
    }),
  ],
})
```

> `unplugin-auto-import` 自动生成 `src/auto-imports.d.ts`，`ref`、`computed`、`watch`、`useRouter`、`useRoute` 等 API 无需手动 import，IDE 自动提示。

### 业务样式 —— Less Modules

选择 **Less** 作为业务样式预处理语言，配合 CSS Modules 实现局部作用域：

```ts
// vite.config.ts
export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCase',  // .title-xxx → styles.titleXxx
      generateScopedName: '[local]_[hash:base64:5]',
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          // 业务主题变量注入
          '@primary-color': '#1677ff',
          '@bg-color': '#f5f5f5',
        },
      },
    },
  },
})
```

```
styles/
├── variables.less          // 全局 Less 变量（颜色、字号、间距）
├── mixins.less             // 公共 mixin（ellipsis、hairline 等）
├── reset.less              // 样式重置
├── global.less             // 全局样式
└── animations.less         // 公共动画
```

```less
// styles/variables.less
@primary-color: #1677ff;
@success-color: #00b578;
@warning-color: #ff8f1f;
@danger-color: #ff3141;
@text-color: #333;
@text-color-secondary: #999;
@font-size-xs: 10px;
@font-size-sm: 12px;
@font-size-base: 14px;
@font-size-lg: 16px;
@border-radius-base: 8px;

// styles/mixins.less
.ellipsis(@lines: 1) when (@lines = 1) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ellipsis(@lines) when (@lines > 1) {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: @lines;
  -webkit-box-orient: vertical;
}

.hairline(@direction: bottom; @color: #eee) {
  position: relative;
  &::after {
    content: '';
    position: absolute;
    background-color: @color;
    transform: scaleY(0.5);
  }
  // 根据 @direction 设置具体定位
}
```

```less
// 使用示例: UserCard.module.less
.card {
  padding: 12px 16px;
  background: #fff;
  border-radius: @border-radius-base;
  .hairline(bottom);

  .name {
    font-size: @font-size-lg;
    color: @text-color;
    .ellipsis(1);
  }

  .desc {
    font-size: @font-size-sm;
    color: @text-color-secondary;
    .ellipsis(2);
  }
}
```

```vue
<!-- 组件中使用 -->
<script setup lang="ts">
import styles from './index.module.less'
</script>

<template>
  <div :class="styles.card">
    <div :class="styles.name">用户名</div>
    <div :class="styles.desc">描述信息</div>
  </div>
</template>
```

> 当组件采用目录式组织时，样式文件位于组件目录内，例如 `HomeHeader/index.vue` 搭配 `HomeHeader/index.module.less`；仍然保持 Less Modules 的局部作用域能力。
> **为什么选 Less 而非 Sass**：Less 上手成本更低、编译速度更快（Vite 内置 Less 支持），变量和 mixin 能力完全满足移动端 H5 需求。Vant 4 使用 CSS Variables，业务侧用 Less 管理复杂样式依然高效。

## 6. 状态管理 —— Pinia 3

### 核心用法

```ts
// stores/counter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // ─── State ───
  const count = ref(0)

  // ─── Getters ───
  const doubleCount = computed(() => count.value * 2)

  // ─── Actions ───
  function increment(): void {
    count.value++
  }

  function decrement(): void {
    count.value--
  }

  return { count, doubleCount, increment, decrement }
})
```

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // ─── State ───
  const token = ref<string | null>(null)
  const userName = ref('')
  const userCode = ref('')

  // ─── Getters ───
  const isLoggedIn = computed(() => !!token.value)

  // ─── Actions ───
  /** 登录成功后设置用户信息 */
  function setUserInfo(newToken: string, newUserName: string, newUserCode: string): void {
    token.value = newToken
    userName.value = newUserName
    userCode.value = newUserCode
  }

  /** 退出登录（persist 插件会自动清除 localStorage） */
  function logout(): void {
    token.value = null
    userName.value = ''
    userCode.value = ''
  }

  return { token, userName, userCode, isLoggedIn, setUserInfo, logout }
}, {
  // ─── 持久化配置 ───
  // pinia-plugin-persistedstate 自动同步到 localStorage，无需手动 getItem/setItem
  persist: {
    pick: ['token', 'userName', 'userCode'],
  },
})
```

> `pinia-plugin-persistedstate` 自动将指定 state 同步到 localStorage。应用启动时自动恢复，`logout()` 中只需清空 state，插件自动清除 localStorage。

```ts
// stores/app.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // ─── State ───
  const theme = ref<'light' | 'dark'>('light')
  const platform = ref<'wechat' | 'alipay' | 'browser'>('browser')
  const loading = ref(false)

  // ─── Actions ───
  /** 检测运行环境 */
  function detectEnvironment(): void {
    const ua = navigator.userAgent.toLowerCase()
    if (/micromessenger/i.test(ua)) {
      platform.value = 'wechat'
    } else if (/alipayclient/i.test(ua)) {
      platform.value = 'alipay'
    } else {
      platform.value = 'browser'
    }
  }

  /** 切换主题 */
  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  /** 全局 loading */
  function setLoading(val: boolean): void {
    loading.value = val
  }

  return { theme, platform, loading, detectEnvironment, toggleTheme, setLoading }
})
```

```vue
<!-- 组件中使用 -->
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <div>
    <span>{{ counter.count }}</span>
    <button @click="counter.increment()">+1</button>
  </div>
</template>
```

> Pinia 与 Vue 响应式深度集成，无需类似 MobX 的 `observer` 包装，在 `<template>` 中直接使用 store 数据自动触发更新。

### Store 架构

```
stores/
├── counter.ts             // 计数器 Store（示例）
├── user.ts                // 用户信息、登录态
├── app.ts                 // 全局 UI 状态（主题、语言、loading）
└── modules/
    ├── cart.ts
    └── order.ts
```

### 状态分层

| 层级 | 方案 |
|------|------|
| 客户端全局状态 | **Pinia**（Store 模块化，Setup 语法） |
| 服务端状态 | **vue-request**（缓存、重试、轮询、防抖） |
| 表单状态 | Vant Form 内置管理 + **Zod** 校验 |
| URL 状态 | Vue Router 查询参数（`useRoute().query`） |
| 通用副作用 | **@vueuse/core**（scroll lock、online status、clipboard 等 200+ composable） |

## 7. 网络层

- **请求库**：axios
- **关键封装**：
  - 请求/响应拦截器（token 注入、统一错误处理）
  - 接口取消（页面卸载取消进行中请求）
  - 请求重试策略
  - 接口缓存（配合 vue-request `cacheKey`）
  - 错误码与 Pinia 状态联动（如 401 自动清除 userStore 登录态）

### Axios 实例封装

```ts
// src/api/request.ts
import axios, { type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'
import { showToast } from 'vant'

// 是否正在刷新登录态
let isRefreshing = false
// 重试请求队列
const retryQueue: Array<() => void> = []

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
})

// ─── 请求拦截 ───
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── 响应拦截 ───
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, data, message } = response.data

    if (code === 0) {
      return data
    }

    // 业务错误码处理
    handleBusinessError(code, message)
    return Promise.reject(new Error(message))
  },
  (error: AxiosError) => {
    // 网络错误处理
    if (!navigator.onLine) {
      showToast('网络已断开，请检查网络连接')
      return Promise.reject(error)
    }

    if (error.response) {
      const { status } = error.response
      handleHttpError(status)
    } else {
      showToast('请求超时，请稍后重试')
    }

    return Promise.reject(error)
  },
)

// ─── HTTP 状态码处理 ───
function handleHttpError(status: number): void {
  const messages: Record<number, string> = {
    401: '登录已过期，请重新登录',
    403: '没有权限访问',
    404: '请求资源不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
  }

  if (status === 401) {
    if (!isRefreshing) {
      isRefreshing = true
      // 跳转登录页：通过 Pinia userStore 清除登录态
      // import { useUserStore } from '@/stores/user'
      // const userStore = useUserStore()
      // userStore.logout()
      // router.push({ name: 'Login' })
      isRefreshing = false
    }
    return
  }

  showToast(messages[status] || `请求失败 (${status})`)
}

// ─── 业务错误码处理 ───
function handleBusinessError(code: number, message: string): void {
  showToast(message || `操作失败 (${code})`)
}

// ─── 导出请求方法 ───
export const get = <T>(url: string, params?: object): Promise<T> =>
  instance.get(url, { params })

export const post = <T>(url: string, data?: object): Promise<T> =>
  instance.post(url, data)

export const put = <T>(url: string, data?: object): Promise<T> =>
  instance.put(url, data)

export const del = <T>(url: string, params?: object): Promise<T> =>
  instance.delete(url, { params })

export default instance
```

### 接口定义

```ts
// src/api/user.ts
import { get, post } from './request'
import type { IUser, ILoginParams, ILoginResult } from '@/types'

export const userApi = {
  /** 登录 */
  login: (params: ILoginParams) => post<ILoginResult>('/auth/login', params),
  /** 获取用户信息 */
  fetchUser: (id: string) => get<IUser>(`/user/${id}`),
  /** 更新用户信息 */
  updateUser: (id: string, data: Partial<IUser>) => put<IUser>(`/user/${id}`, data),
}
```

### 与 vue-request 集成

```vue
<!-- 组件中使用 -->
<script setup lang="ts">
import { useRequest } from 'vue-request'
import { userApi } from '@/api/user'

interface IProps {
  userId: string
}

const props = defineProps<IProps>()

// 查询（自动请求）
const { data: user, loading } = useRequest(
  () => userApi.fetchUser(props.userId),
  {
    refreshDeps: [() => props.userId],  // userId 变化时自动重新请求
    cacheKey: () => `user-${props.userId}`,
    cacheTime: 5 * 60 * 1000,           // 5 分钟缓存
  }
)

// 手动触发（如提交表单）
const { run: updateUserInfo, loading: updating } = useRequest(
  (data: Partial<User>) => userApi.updateUser(props.userId, data),
  { manual: true }
)

const onSubmit = (): void => {
  updateUserInfo({ name: '新名字' })
}
</script>

<template>
  <van-loading v-if="loading" />
  <div v-else>{{ user?.name }}</div>
</template>
```

## 8. 多环境配置

### 三套环境

```bash
# .env.development
VITE_APP_ENV=develop
VITE_API_BASE_URL=https://api-dev.example.com
VITE_API_TIMEOUT=30000

# .env.staging
VITE_APP_ENV=testing
VITE_API_BASE_URL=https://api-test.example.com
VITE_API_TIMEOUT=30000

# .env.production
VITE_APP_ENV=product
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT=15000
```

### package.json scripts

```json
{
  "scripts": {
    "dev":            "vite",
    "dev:staging":    "vite --mode staging",
    "build:develop":  "vite build --mode development",
    "build:testing":  "vite build --mode staging",
    "build:product":  "vite build --mode production"
  }
}
```

### 环境判断工具

```ts
// src/config/env.ts
export const ENV = import.meta.env.VITE_APP_ENV
export const IS_DEV = ENV === 'develop'
export const IS_TEST = ENV === 'testing'
export const IS_PROD = ENV === 'product'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
```

### 环境变量类型声明

为 `import.meta.env` 补充类型定义，IDE 自动提示、拼写错误编译期可发现：

```ts
// src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'develop' | 'testing' | 'product'
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// vite.config.ts define 注入的全局常量
declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string
declare const __GIT_HASH__: string
```

### 全局类型定义

```ts
// src/types/index.d.ts
/** 用户信息 */
interface IUser {
  id: string
  name: string
  code: string
  avatar?: string
  email?: string
}

/** 登录参数 */
interface ILoginParams {
  username: string
  password: string
}

/** 登录结果 */
interface ILoginResult {
  token: string
  userName: string
  userCode: string
}

/** 通用 API 响应结构 */
interface IApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}
```

## 9. 打包分包策略 —— 加速首屏

```ts
// vite.config.ts
export default defineConfig({
  build: {
    target: ['es2020', 'safari12', 'chrome69', 'firefox68'],
    cssTarget: 'safari12',

    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-vue',
              test: /node_modules[\\/]vue(-router|-dom)?/,
              priority: 20,
            },
            {
              name: 'vendor-pinia',
              test: /node_modules[\\/]pinia/,
              priority: 15,
            },
            {
              name: 'vendor-vant',
              test: /node_modules[\\/]vant/,
              priority: 15,
            },
            {
              name: 'vendor-other',
              test: /node_modules/,
              priority: 10,
            },
          ],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
```

### 分包效果

```
dist/assets/js/
├── index-[hash].js              // 业务入口
├── Home-[hash].js               // 路由懒加载页面
├── vendor-vue-[hash].js         // Vue 3 + Vue Router（~45KB gzip）
├── vendor-pinia-[hash].js       // Pinia（~3KB gzip）
├── vendor-vant-[hash].js        // Vant 按需（~30-60KB gzip）
└── vendor-other-[hash].js       // 其他工具库
```

### 首屏加载链路

```
index.html
  → vendor-vue（并行）
  → vendor-pinia（并行）
  → index.js（依赖上面完成）
  → Home.js（路由懒加载）
  → 骨架屏 → 接口数据 → 渲染完成
```

- 静态资源 CDN + hash 文件名 + 长期缓存（`max-age=31536000`）
- `index.html` 不缓存（`no-cache`）

## 10. 兼容性 —— 2018 年至今主流机型

### 浏览器兼容目标

2018 年主流机型对应系统版本：

| 机型/系统 | 最低版本 | 代表设备 |
|-----------|---------|---------|
| iPhone | iOS 12+ | iPhone 6s / 7 / 8 / X |
| Android | Chrome 69+（Android 8+） | 华为 P20、小米 8、OPPO R15 |
| 微信内置浏览器 | 7.0+ | 2018 年微信已到 7.0 |
| 鸿蒙 | HarmonyOS 2+ | 覆盖所有鸿蒙设备 |

```
# .browserslistrc
> 0.5%
last 3 versions
not dead
iOS >= 12
Chrome >= 69
Android >= 69
```

```ts
// vite.config.ts
build: {
  target: ['es2020', 'safari12', 'chrome69', 'firefox68'],
  cssTarget: 'safari12',
}
```

### Polyfill 策略

2018 年机型意味着需要覆盖 iOS 12 Safari，它缺少部分 ES2019+ 特性：

```ts
// vite.config.ts
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['iOS >= 12', 'Chrome >= 69'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,       // 生成 legacy 产物
      modernPolyfills: true,          // 现代浏览器也按需注入
    }),
  ],
})
```

**产物结构**：

```
dist/
├── assets/
│   ├── js/
│   │   ├── vendor-vue-[hash].js           // 现代浏览器（<script type="module">）
│   │   ├── vendor-vue-legacy-[hash].js    // 旧浏览器（<script nomodule>）
│   │   └── ...
│   └── polyfills-legacy.[hash].js           // legacy polyfill
└── index.html
```

> `type="module"` + `nomodule` 双栈：现代浏览器加载 module 版本（更快更小），2018 年旧机型自动走 legacy + polyfill 版本。

### CSS 兼容

- **autoprefixer**（Vite 内置 postcss 处理）自动加 `-webkit-` 前缀
- iOS 12 需要注意的 CSS 限制：
  - 不支持 `gap` in Flexbox（用 margin 替代）
  - 不支持 `env(safe-area-inset-*)`（iOS 11+ 支持，iOS 12 OK）
  - `vh` 单位在移动 Safari 有地址栏问题，建议用 `%` 或 `-webkit-fill-available`

```less
// styles/safe-area.less
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom); // iOS 11
  padding-bottom: env(safe-area-inset-bottom);       // iOS 12+
}
```

## 11. 代码规范 —— ESLint v9 + Prettier v3

### ESLint v9 Flat Config

ESLint v9 全面采用 Flat Config，不再使用 `.eslintrc`：

```ts
// eslint.config.ts
import vuePlugin from 'eslint-plugin-vue'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  // 全局忽略
  {
    ignores: ['dist/**', 'node_modules/**', '*.js'],
  },
  // Vue + TypeScript 配置
  {
    files: ['**/*.vue', '**/*.ts'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'vue': vuePlugin,
      'prettier': prettierPlugin,
    },
    rules: {
      // Vue 规则
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/require-default-prop': 'off',
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-macros-order': ['error', {
        order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'],
      }],
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
      }],
      // Prettier 冲突规则禁用
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
    },
  },
]
```

> `vue/component-api-style`: 强制只使用 `<script setup>` 风格，禁止 Options API。
> `@typescript-eslint/no-explicit-any`: 设为 `error`，严格禁止 `any`。
> `@typescript-eslint/consistent-type-imports`: 强制使用 `import type`，确保类型导入被正确擦除。

### Prettier v3

```json
// .prettierrc.json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Git Hooks

```json
// package.json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write \"src/**/*.{ts,vue,less,json}\"",
    "type-check": "vue-tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.less": [
      "prettier --write"
    ]
  }
}
```

> 类型检查使用 `vue-tsc`（非 `tsc`），它会校验 `.vue` 模板中的 TypeScript 类型。

### 关键依赖版本

```json
{
  "devDependencies": {
    "eslint": "^9.0.0",
    "eslint-plugin-vue": "^9.30.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "vue-eslint-parser": "^9.4.0",
    "eslint-config-prettier": "^10.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "commitlint": "^19.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0"
  }
}
```

## 12. 性能优化

```
├── 首屏加载
│   ├── 分包策略（见第 9 节）
│   ├── 路由懒加载 + Suspense + Vant Skeleton
│   ├── 图片懒加载 + WebP/AVIF + CDN
│   ├── preload 关键字体/首屏图片
│   └── preconnect CDN（<link rel="preconnect">）
├── 运行时
│   ├── Vue 响应式精确更新（无需手动优化，自动追踪依赖）
│   ├── v-memo / v-once 指令优化大列表渲染
│   ├── shallowRef / shallowReactive 减少深层响应式开销
│   ├── 虚拟列表（@tanstack/vue-virtual 或 vue-virtual-scroller）
│   ├── 非首屏组件 Intersection Observer 懒渲染
│   ├── KeepAlive 缓存页面组件
│   └── 动画走 GPU 合成层（transform/opacity）
└── 产物优化
    ├── 分包 + Tree Shaking
    ├── gzip/brotli 预压缩（见第 24 节）
    └── rollup-plugin-visualizer 分析包体积（兼容 Rolldown 产物）
```

### Suspense + onErrorCaptured 层级策略

配合路由懒加载和 vue-request（数据加载），统一 Suspense 与错误捕获的嵌套层级：

```
App 根组件
├── <Suspense>                                       // 路由级：页面加载态
│   ├── <ErrorBoundary composable>                   // 路由级：页面错误兜底
│   │   └── <RouterView />                           // 路由出口
│   │       ├── <Suspense>                           // 组件级：异步数据/懒组件
│   │       │   └── <UserDetail />
│   │       └── <SyncComponent />
```

```vue
<!-- layouts/AppLayout.vue -->
<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'
import AppSkeleton from '@/components/AppSkeleton/index.vue'

const catchError = ref<Error | null>(null)

onErrorCaptured((err) => {
  console.error('[ErrorBoundary]', err)
  catchError.value = err
  return false
})
</script>

<template>
  <div v-if="catchError" class="error-wrap">
    <p>页面出了点问题</p>
    <button @click="catchError = null">点击重试</button>
  </div>
  <Suspense v-else>
    <template #default>
      <router-view />
    </template>
    <template #fallback>
      <AppSkeleton />
    </template>
  </Suspense>
</template>
```

**原则**：
- **路由级** Suspense + onErrorCaptured 包裹 `<RouterView>`，每个路由页面自动获得加载态和错误兜底
- **组件级** Suspense 仅在需要局部加载态时使用（如某区块数据独立请求）
- Suspense fallback 统一使用 Vant Skeleton，保持加载态视觉一致
- Vue 3 无需 class 组件实现 ErrorBoundary，`onErrorCaptured` 钩子即可

---

## 补充建议

### 13. 请求防重复 & 接口竞态

移动端弱网、快速点击场景下，同一接口可能被重复调用：

```ts
// utils/request.ts
const pendingMap = new Map<string, AbortController>()

function generateReqKey(config: AxiosRequestConfig): string {
  return [config.method, config.url, JSON.stringify(config.params)].join('&')
}

// 请求拦截：相同请求自动取消上一个
// 响应拦截：完成后从 pendingMap 移除
```

> vue-request 内置 `debounceWait` / `throttleWait` 可缓解部分竞态场景，但仍建议在 Axios 层做请求去重。

### 14. 错误边界 —— Composable 方案

Vue 3 不需要 class 组件实现 ErrorBoundary，使用 `onErrorCaptured` 钩子即可。

> **注意**：`onErrorCaptured` 只能捕获**子组件**抛出的错误，无法捕获当前组件自身的错误。因此需在父级布局组件中注册，包裹子组件的渲染出口。

```ts
// composables/useErrorBoundary.ts
import { onErrorCaptured, ref, type Ref } from 'vue'

interface IErrorBoundaryResult {
  error: Ref<Error | null>
  hasError: Ref<boolean>
  resetError: () => void
}

export function useErrorBoundary(): IErrorBoundaryResult {
  const error = ref<Error | null>(null)
  const hasError = ref(false)

  onErrorCaptured((err) => {
    console.error('[ErrorBoundary]', err)
    error.value = err
    hasError.value = true
    return false // 阻止继续向上传播
  })

  function resetError(): void {
    error.value = null
    hasError.value = false
  }

  return { error, hasError, resetError }
}
```

```vue
<!-- 使用示例 — 在父级布局中包裹子组件 -->
<script setup lang="ts">
import { useErrorBoundary } from '@/composables/useErrorBoundary'

const { hasError, resetError } = useErrorBoundary()
</script>

<template>
  <div v-if="hasError" class="error-wrap">
    <p>页面出了点问题</p>
    <button @click="resetError">点击重试</button>
  </div>
  <slot v-else />
</template>
```

### 15. AppSkeleton 骨架屏组件

```vue
<!-- src/components/AppSkeleton/index.vue -->
<script setup lang="ts">
// 无需额外逻辑，纯展示组件
</script>

<template>
  <div style="padding: 16px">
    <van-skeleton title :row="5" animated />
  </div>
</template>
```

### 16. 图片优化组件

封装统一图片组件，处理移动端图片场景：

```vue
<!-- src/components/OptImage/index.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface IOptImageProps {
  src: string
  width?: number
  height?: number
  quality?: number
  fallback?: string
  lazy?: boolean
}

const props = withDefaults(defineProps<IOptImageProps>(), {
  quality: 80,
  lazy: true,
})

// CDN 参数裁剪 + WebP 自动降级
const optimizedSrc = computed(() => {
  if (!props.width) return props.src
  return `${props.src}?imageView2/2/w/${props.width}/q/${props.quality}/format/webp`
})

const onError = (e: Event): void => {
  const img = e.target as HTMLImageElement
  if (props.fallback) {
    img.src = props.fallback
  }
}
</script>

<template>
  <picture>
    <source :srcset="optimizedSrc" type="image/webp" />
    <source :srcset="src" type="image/jpeg" />
    <img
      :src="optimizedSrc"
      :loading="lazy ? 'lazy' : 'eager'"
      @error="onError"
      alt=""
    />
  </picture>
</template>
```

### 17. Less 主题系统与 Vant 联动

**单一变量体系**：业务主题统一使用 Less 变量管理（定义在 `variables.less`），通过 Vite `modifyVars` 在构建时注入。Vant 4 使用 CSS Variables 做运行时主题覆盖，通过 `theme.less` 将 Less 变量映射到 Vant CSS Variables：

```less
// styles/theme.less — 仅负责将 Less 变量映射到 Vant CSS Variables
:root {
  // 将业务 Less 变量（通过 modifyVars 注入）映射到 Vant CSS Variables
  --van-color-primary: @primary-color;
  --van-color-success: @success-color;
  --van-color-warning: @warning-color;
  --van-color-danger: @danger-color;
  --van-font-size-md: @font-size-base;
}
```

> **为什么这样设计**：Less 变量是编译时单点维护，`theme.less` 做一次映射即可让 Vant 组件使用业务色值。如需暗色主题，在 `theme.less` 中添加 `[data-theme='dark']` 覆盖对应 Vant CSS Variables。

```ts
// Pinia AppStore 切换主题
export const useAppStore = defineStore('app', () => {
  const theme = ref<'light' | 'dark'>('light')

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return { theme, toggleTheme }
})
```

### 18. 移动端 viewport 滚动穿透治理

弹窗/抽屉打开时 body 滚动穿透是移动端高频问题。优先使用 `@vueuse/core` 提供的 `useScrollLock`：

```vue
<!-- 使用 @vueuse/core 的 useScrollLock -->
<script setup lang="ts">
import { ref } from 'vue'
import { useScrollLock } from '@vueuse/core'

const showPopup = ref(false)
// 传入 document.body 锁定滚动
useScrollLock(document.body, showPopup)
</script>
```

> `@vueuse/core` 提供了 200+ 个经过生产验证的 composable，常见的 `useScrollLock`、`useOnline`、`useClipboard`、`useVModel`、`useDebounceFn` 等应优先从 `@vueuse/core` 引入，而非手写。仅在 `@vueuse/core` 未覆盖的业务场景下才在 `composables/` 目录手写。

> Vant 的 Popup/Dialog 内部已处理滚动穿透，但自定义弹窗组件时需自行处理。

### 19. Source Map 安全

生产环境 Source Map 不应暴露到前端，但需要用于排查问题：

```ts
// vite.config.ts（完整配置见附录 A）
// sourcemap 使用 loadEnv 获取环境变量判断
sourcemap: env.VITE_APP_ENV === 'product' ? 'hidden' : true,
```

- 构建 CI 中上传 `.map` 到 Sentry/监控平台，然后**删除服务器上的 map 文件**
- 线上用户报错时通过平台还原源码位置

### 20. Less 全局注入优化

每个 `.module.less` 文件手动 `@import` 变量文件很繁琐，通过 Vite 配置自动注入：

```ts
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: `@import "@/styles/variables.less";\n@import "@/styles/mixins.less";\n`,
      },
    },
  },
})
```

> 这样任何 `.less` 文件可直接使用 `@primary-color`、`.ellipsis()` 等，无需手动 import。

### 21. 构建产物版本信息注入

线上排查问题时需要知道当前构建版本和 commit：

```ts
// vite.config.ts
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __GIT_HASH__: JSON.stringify(
      execSync('git rev-parse --short HEAD').toString().trim()
    ),
  },
})
```

```vue
<!-- About 页面展示 / Sentry 上报 -->
<script setup lang="ts">
console.log(`v${__APP_VERSION__} (${__GIT_HASH__} ${__BUILD_TIME__})`)
</script>
```

### 22. commit 规范 + changelog 自动生成

```ts
// commitlint.config.ts
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style',
      'refactor', 'perf', 'test', 'chore', 'revert',
    ]],
    'subject-max-length': [2, 'always', 100],
  },
}
```

配合 `conventional-changelog` 在发版时自动生成 CHANGELOG.md。

### 23. 包版本锁定

- `pnpm-lock.yaml` 提交到仓库，锁定确切版本
- `package.json` 版本策略：
  - **主依赖**（vue、pinia、vue-router 等）使用 `~`（允许 patch 升级，获取安全修复）
  - **开发依赖**（eslint、prettier 等）使用 `^`（允许 minor 升级）
  - 示例：`"vue": "~3.5.0"`、`"eslint": "^9.0.0"`
- 定期 `pnpm update --interactive` 升级依赖
- CI 环境通过 `pnpm install --frozen-lockfile` 确保版本一致性

### 24. 产物压缩 —— gzip / brotli 预压缩

静态资源预压缩可显著减少传输体积，配合 CDN 直接返回 `.gz` / `.br` 文件：

```ts
// vite.config.ts
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [
    // 生成 .gz 预压缩文件
    compression({
      algorithm: 'gzip',
      threshold: 10 * 1024,       // 大于 10KB 才压缩
      deleteOriginalAssets: false, // 保留原文件
    }),
    // 可选：同时生成 .br（brotli，压缩率更高）
    compression({
      algorithm: 'brotliCompress',
      threshold: 10 * 1024,
      deleteOriginalAssets: false,
    }),
  ],
})
```

> Nginx 配置 `gzip_static on` 或 `brotli_static on` 即可自动返回预压缩版本，无需实时压缩。

### 25. CI/CD 基本流程

脚手架应内置基本的 CI 配置，确保代码质量门禁：

```yaml
# .github/workflows/ci.yml（示例）
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint            # ESLint 检查
      - run: pnpm type-check      # vue-tsc 类型检查
      - run: pnpm build:product   # 构建验证
```

> 最低要求：lint → type-check → build 三步通过。有测试后加入 `pnpm test` 步骤。

---

## 附录 A：完整 vite.config.ts

将文档中分散的 Vite 配置合并为一个完整版本，可直接使用：

```ts
// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import { execSync } from 'child_process'
import path from 'path'
import pkg from './package.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue(),
      legacy({
        targets: ['iOS >= 12', 'Chrome >= 69'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        renderLegacyChunks: true,
        modernPolyfills: true,
      }),
      Components({
        resolvers: [VantResolver()],
      }),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
        dts: 'src/auto-imports.d.ts',
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: '[local]_[hash:base64:5]',
      },
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            '@primary-color': '#1677ff',
            '@bg-color': '#f5f5f5',
          },
          additionalData: `@import "@/styles/variables.less";\n@import "@/styles/mixins.less";\n`,
        },
      },
    },

    build: {
      target: ['es2020', 'safari12', 'chrome69', 'firefox68'],
      cssTarget: 'safari12',
      sourcemap: env.VITE_APP_ENV === 'product' ? 'hidden' : true,

      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-vue',
                test: /node_modules[\\/]vue(-router|-dom)?/,
                priority: 20,
              },
              {
                name: 'vendor-pinia',
                test: /node_modules[\\/]pinia/,
                priority: 15,
              },
              {
                name: 'vendor-vant',
                test: /node_modules[\\/]vant/,
                priority: 15,
              },
              {
                name: 'vendor-other',
                test: /node_modules/,
                priority: 10,
              },
            ],
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __GIT_HASH__: JSON.stringify(
        execSync('git rev-parse --short HEAD').toString().trim(),
      ),
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  }
})
```

## 附录 B：完整 package.json

```json
{
  "name": "vue3-h5-template",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "dev:staging": "vite --mode staging",
    "build:develop": "vite build --mode development",
    "build:testing": "vite build --mode staging",
    "build:product": "vite build --mode production",
    "preview": "vite preview",
    "prepare": "husky",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write \"src/**/*.{ts,vue,less,json}\"",
    "type-check": "vue-tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.less": [
      "prettier --write"
    ]
  },
  "dependencies": {
    "vue": "~3.5.0",
    "vue-router": "~4.5.0",
    "pinia": "~3.0.0",
    "pinia-plugin-persistedstate": "~4.7.0",
    "vant": "~4.9.0",
    "vue-request": "~2.0.0",
    "@vueuse/core": "~10.7.0",
    "axios": "~1.7.0",
    "zod": "~3.24.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "@vitejs/plugin-legacy": "^8.0.0",
    "vite": "^8.0.0",
    "typescript": "^5.7.0",
    "vue-tsc": "^2.2.0",
    "unplugin-vue-components": "^28.0.0",
    "unplugin-auto-import": "^21.0.0",
    "@vant/auto-import-resolver": "^1.3.0",
    "less": "^4.2.0",
    "postcss-px-to-viewport-8-plugin": "^1.2.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-plugin-vue": "^9.30.0",
    "vue-eslint-parser": "^9.4.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint-config-prettier": "^10.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "commitlint": "^19.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "rollup-plugin-visualizer": "^5.12.0",
    "vite-plugin-compression2": "^2.5.0"
  }
}
```

---

## 最终技术栈

```
Vue 3.5 + TypeScript 5 + Vite 8
+ Vant 4                    （组件库）
+ Pinia 3 + persistedstate   （状态管理 + 持久化）
+ Vue Router 4               （路由）
+ vue-request                （服务端状态）
+ @vueuse/core               （通用 Composable 库）
+ Less + CSS Modules         （样式方案）
+ postcss-px-to-viewport-8-plugin    （移动端适配）
+ @vitejs/plugin-legacy      （2018+ 机型兼容）
+ Axios                      （网络请求）
+ Zod                        （数据校验）
+ unplugin-auto-import       （API 自动导入）
+ ESLint v9 + Prettier v3    （代码规范）
+ Husky + lint-staged        （Git 规范）
```
