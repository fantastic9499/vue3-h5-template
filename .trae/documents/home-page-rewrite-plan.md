# Home 页面重写计划（按 vue3-architecture.md 规范）

## Summary
- 目标：将 [home/index.vue](file:///Users/tuxunjia/code/react/vue3-h5-template/src/pages/home/index.vue) 从空白示例页重写为接近截图的移动端首页 UI，并按功能区域拆分为多个组件。
- 约束：严格遵循 [vue3-architecture.md](file:///Users/tuxunjia/code/react/vue3-h5-template/vue3-architecture.md) 的代码规范/目录约定；使用 `<script setup lang="ts">`；事件函数 `onXxx`；样式使用 Less + CSS Modules；移动端适配依赖当前项目的 px→vw（viewportWidth=375）。
- 特别说明：截图最顶部「益智通 + 返回箭头」属于微信容器导航条，不在 Web 页面内实现；页面从其下方的蓝色信息区开始实现。

## Current State Analysis
- 当前 Home 页面仅包含标题/描述/跳转链接，无组件拆分、无样式实现：[home/index.vue](file:///Users/tuxunjia/code/react/vue3-h5-template/src/pages/home/index.vue)。
- 路由结构：`/` 下挂子路由，Home meta 已开启 keepAlive；布局由 [AppLayout.vue](file:///Users/tuxunjia/code/react/vue3-h5-template/src/layouts/AppLayout.vue) 承载，KeepAlive include 来自 `route.meta.keepAlive`。[router/index.ts](file:///Users/tuxunjia/code/react/vue3-h5-template/src/router/index.ts)
- 移动端适配：PostCSS 已启用 `postcss-px-to-viewport-8-plugin`，业务样式写 px 会转换为 vw（排除 vant）。[postcss.config.ts](file:///Users/tuxunjia/code/react/vue3-h5-template/postcss.config.ts)
- 组件/样式规范要点（将作为实现依据）：
  - 组件目录化：`PascalCase/ index.vue + index.module.less`。[vue3-architecture.md:L307-L314](file:///Users/tuxunjia/code/react/vue3-h5-template/vue3-architecture.md#L307-L314)
  - 事件函数必须 `onXxx`，禁止 `handleXxx`。[vue3-architecture.md:L361-L366](file:///Users/tuxunjia/code/react/vue3-h5-template/vue3-architecture.md#L361-L366)
  - 业务样式 Less + CSS Modules（`localsConvention: camelCase` 已在 Vite 配置）。[vite.config.ts](file:///Users/tuxunjia/code/react/vue3-h5-template/vite.config.ts)

## Decisions Locked With User
- 图片/图标：优先使用 Vant Icon + CSS（不新增图片资源）。
- TabBar：新增占位页面并与路由联动（首页/目录/我的）。
- 顶部微信导航条：不实现。
- 动态内容：各功能区组件预留 props；页面内部先用 mock 数据组装。
- Tab 页缓存：首页/目录/我的需要 keep-alive 缓存。

## Proposed Changes

### 1) 重写 Home 页面骨架与样式
- 修改文件：
  - [home/index.vue](file:///Users/tuxunjia/code/react/vue3-h5-template/src/pages/home/index.vue)
  - 新增 [home/index.module.less](file:///Users/tuxunjia/code/react/vue3-h5-template/src/pages/home/index.module.less)
- 实现要点：
  - 以「页面容器」+「功能区组件」方式组织；页面仅负责组装数据与布局，不在页面内堆叠复杂逻辑。
  - 页面容器考虑安全区与 TabBar 占位：底部预留 `padding-bottom: calc(XXpx + env(safe-area-inset-bottom))`，避免内容被 TabBar 覆盖。
  - 使用 CSS Modules：`import styles from './index.module.less'`，class 使用 `:class="styles.xxx"`。
  - 页面视觉还原（尽量贴近截图）：
    - 顶部蓝色渐变背景区域（不包含微信导航条）。
    - 信息卡片：头像（Vant Icon / 圆形占位）、姓名、右侧日期块（大号日期 + 月份/星期）。
    - 白色内容卡片区：我的应用（三个入口宫格）、通知横幅、最近浏览卡片（插画用 Icon + 简单形状近似）。

### 2) 按功能区拆分组件（目录化）
- 新增目录（均放在 `src/pages/home/components/` 下，遵循目录化规范）：
  - `HomeHero/`：顶部蓝色信息区（头像、姓名、日期）。props：`name`、`date`（结构化 props，避免在组件内做业务拼装）。
  - `HomeAppSection/`：我的应用宫格。props：`title`、`items: IHomeAppItem[]`；事件：`onItemClick(item)`（若需要对外抛出）。
  - `HomeAnnouncement/`：通知横幅。props：`text`；如需要滚动效果可优先使用 `van-notice-bar`，否则自绘一行布局。
  - `HomeRecentBrowse/`：最近浏览卡片。props：`title`、`emptyText`、`status`（例如 `noPermission`）。
  - `HomeTabBar/`：底部 TabBar（路由联动）。props：`activePath` 或直接基于 `useRoute()` 计算；使用 `van-tabbar route` + `to`。
- 每个组件包含：
  - `index.vue`：`<script setup lang="ts">`、props interface `I` 前缀、事件函数 `onXxx`。
  - `index.module.less`：仅负责本组件样式；尺寸用 px 编写（由 px→vw 转换适配不同机型）。

### 3) 新增占位页面与路由联动（目录/我的）
- 新增页面：
  - `src/pages/catalog/index.vue`（defineOptions name：`CatalogPage`）
  - `src/pages/me/index.vue`（defineOptions name：`MePage`）
- 路由调整：
  - 更新 [router/index.ts](file:///Users/tuxunjia/code/react/vue3-h5-template/src/router/index.ts)：新增子路由 `catalog`、`me`，并设置 `meta.keepAlive: true`，以配合 TabBar 切换缓存。
- TabBar 跳转映射：
  - 首页：`/`
  - 目录：`/catalog`
  - 我的：`/me`
  - 现有 `/user/profile` 保留不动；`/me` 占位页可提供入口跳转到 `/user/profile`（仅简单链接）。

## Assumptions
- 颜色/间距/字体将以截图为参考做近似还原（在无设计标注/切图资源情况下，允许 5–10% 视觉误差）。
- 图标使用 Vant Icon 替代截图中的自定义图标，保证工程内可落地且无需新增资源。

## Verification
- 静态检查：
  - `pnpm lint`（或项目现有 lint 脚本）
  - `pnpm type-check`
- 运行验证：
  - 启动开发服务，检查：
    - 首页视觉结构与截图一致（微信导航条不实现）。
    - TabBar 点击可在 `/`、`/catalog`、`/me` 间切换且 keep-alive 生效（切换后状态不丢）。
    - 不同宽度设备下布局不溢出、不被底部安全区遮挡。

