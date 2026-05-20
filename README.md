# Vue 3 H5 Template

基于 Vue 3 + TypeScript + Vite 的移动端 H5 脚手架模板。

## 技术栈

- **Vue 3** + Composition API + `<script setup>`
- **TypeScript**
- **Vite 8** 构建
- **Vue Router 4** 路由
- **Pinia 3** 状态管理（持久化）
- **Vant 4** 移动端 UI 组件库（按需导入）
- **Axios** 网络请求
- **Less** CSS 预处理
- **postcss-px-to-viewport** 移动端适配

## 项目结构

```
src/
├── api/          # 接口请求
├── components/   # 公共组件
├── composables/  # 组合式函数
├── config/       # 环境配置
├── layouts/      # 布局组件
├── pages/        # 页面
├── router/       # 路由配置
├── stores/       # Pinia 状态管理
├── styles/       # 全局样式
├── types/        # TypeScript 类型定义
└── utils/        # 工具函数
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build:product
```

## 代码规范

- **ESLint** + **Prettier** 代码格式化
- **Husky** + **lint-staged** 提交前自动检查
- **commitlint** 提交信息规范（Conventional Commits）

```
feat: 新功能
fix: 修复 bug
docs: 文档变更
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建/工具变更
```
