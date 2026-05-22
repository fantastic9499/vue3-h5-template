---
name: scaffold-builder
description: "在空项目目录中搭建 Vue 3 移动端 H5 脚手架。当用户要求搭建脚手架、初始化项目、创建 Vue3 项目时触发。"
---

# Vue 3 H5 脚手架搭建

按以下步骤在空项目目录中搭建完整的 Vue 3 移动端 H5 脚手架。每个步骤的详细配置参考 `reference/vue3-architecture.md` 对应章节。

## 前提条件

- 空项目目录（或只有 package.json 的目录）
- 已安装 pnpm
- 项目根目录下存在本 Skill（`.claude/skills/scaffold-builder/`）

## 执行步骤

严格按照以下顺序执行，每步完成后向用户报告进度。

### 步骤 1：初始化项目

1. 确认 `package.json` 存在，不存在则执行 `pnpm init`
2. 将 `package.json` 的 `type` 设为 `"module"`
3. 安装依赖，包列表和版本参考 `reference/vue3-architecture.md` **附录 B**
4. 使用 **pnpm**，禁止使用 npm/yarn

### 步骤 2：生成目录结构

创建以下目录（参考 `reference/vue3-architecture.md` **第 1 节**）：

```
src/
├── api/
├── assets/
├── components/
├── composables/
├── config/
├── layouts/
├── pages/
├── router/
├── stores/
│   └── modules/
├── styles/
├── types/
└── utils/
public/
```

### 步骤 3：生成配置文件

按顺序生成以下配置文件，详细内容参考 `reference/vue3-architecture.md` 对应章节：

| 文件 | 参考章节 |
|------|---------|
| `tsconfig.json` + `tsconfig.node.json` | 第 1 节 |
| `eslint.config.ts` | 第 11 节 |
| `.prettierrc.json` | 第 11 节 |
| `vite.config.ts` | 附录 A |
| `postcss.config.ts` | 第 4 节 |
| `commitlint.config.ts` | 第 22 节 |
| `.env.development` / `.env.staging` / `.env.production` | 第 8 节 |
| `.browserslistrc` | 第 10 节 |
| `.gitignore` | — |
| `.vscode/settings.json` | — |

**关键约束**：
- `.prettierrc.json` 中 `"semi"` 必须为 `true`，`"singleQuote"` 必须为 `true`
- `tsconfig.json` 必须启用 `strict: true`、`noUncheckedIndexedAccess: true`、`noImplicitOverride: true`、`verbatimModuleSyntax: true`
- 路径别名 `@/*` 映射到 `src/*`

### 步骤 4：生成样式基础设施

参考 `reference/vue3-architecture.md` **第 5 节** 和 **第 17 节**，生成：

- `src/styles/variables.less` — 全局 Less 变量
- `src/styles/mixins.less` — 公共 mixin（ellipsis、hairline）
- `src/styles/reset.less` — 样式重置
- `src/styles/global.less` — 全局样式
- `src/styles/theme.less` — Vant CSS Variables 联动
- `src/styles/animations.less` — 公共动画

### 步骤 5：生成入口文件

参考 `reference/vue3-architecture.md` **第 1 节** 和 **第 3 节**，生成：

- `index.html` — 入口 HTML（viewport meta 禁止缩放）
- `src/env.d.ts` — 环境变量类型声明（第 8 节）
- `src/main.ts` — 渲染入口（Pinia + 持久化插件 + Router）
- `src/App.vue` — 根组件（全局错误监听 + ErrorBoundary）
- `src/layouts/AppLayout.vue` — 根布局（Suspense + KeepAlive + RouterView）

**关键约束**：
- 所有 `.vue` 文件块顺序：`<template>` → `<script setup>` → `<style>`
- 使用 Hash 路由（`createWebHashHistory`）

### 步骤 6：生成路由骨架

参考 `reference/vue3-architecture.md` **第 3 节**，生成：

- `src/router/types.ts` — RouteMeta 类型扩展
- `src/router/index.ts` — 路由表（懒加载 + 404 + catch-all）
- `src/router/guard.ts` — 路由守卫（title 设置 + 登录拦截）

### 步骤 7：生成 Store 骨架

参考 `reference/vue3-architecture.md` **第 6 节**，生成：

- `src/stores/app.ts` — 全局 UI 状态（主题、环境检测、loading）
- `src/stores/user.ts` — 用户信息 + 登录态（含持久化配置）

### 步骤 8：生成网络层和工具

参考 `reference/vue3-architecture.md` **第 7 节** 和 **第 8 节**，生成：

- `src/api/request.ts` — Axios 实例 + 拦截器 + 错误处理
- `src/config/env.ts` — 环境变量导出
- `src/types/index.d.ts` — 全局类型定义（IUser、ILoginParams 等）
- `src/utils/storage.ts` — localStorage 封装

### 步骤 9：生成页面骨架

生成最小可运行的页面：

- `src/pages/home/index.vue` — 首页（含 `defineOptions({ name: 'HomePage' })`）
- `src/pages/404.vue` — 404 页面

### 步骤 10：Git 规范

1. 执行 `pnpm prepare` 初始化 Husky
2. 创建 `.husky/pre-commit`：`pnpm lint-staged`
3. 创建 `.husky/commit-msg`：`pnpm exec commitlint --edit $1`
4. 补充 `package.json` scripts（参考附录 B）

### 步骤 11：验证

依次运行以下命令，全部通过才算完成：

1. `pnpm dev` — 确认开发服务器启动无报错
2. `pnpm lint` — 确认 ESLint 检查通过
3. `pnpm type-check` — 确认 TypeScript 编译通过

如果验证失败，修复问题后重新验证，直到全部通过。

## 执行原则

- **读参考文件再动手**：每个步骤开始前，先读取 `reference/vue3-architecture.md` 对应章节的完整内容，确保配置准确
- **不要省略或跳过步骤**：11 个步骤全部执行完毕
- **不要自由发挥**：配置内容以参考文件为准，不要用自己的判断替换
- **生成可运行的项目**：最终产物必须能通过步骤 11 的验证
