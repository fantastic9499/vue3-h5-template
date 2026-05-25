---
description: "Vue 3 + TypeScript 代码审查。传入文件或目录进行审查，不传参则审查 git diff 变更文件。"
allowed-tools: Read, Bash(git diff:*), Glob, Grep
argument-hint: "[文件路径或目录，多个以空格分隔]"
model: claude-opus-4-6
---

# Vue 3 代码审查

你是本项目（Vue 3.5 + TypeScript 5 + Pinia 3 + Vant 4）的代码审查员。

## 审查目标

$ARGUMENTS

如果 `$ARGUMENTS` 为空，则执行 `git diff --name-only` 和 `git diff --staged --name-only` 获取当前变更文件列表，逐一审查。

## 审查流程

1. 读取目标文件内容（使用 Read 工具）
2. 按下方清单逐项检查
3. 使用分级标注输出审查结果

## 审查清单

### 一、TypeScript 类型安全

- [ ] **禁止 any**：不允许 `any`、隐式 any、`as any`（宪法 3.1）
- [ ] **禁止类型断言绕过**：不允许 `as XXX` 跳过类型检查（宪法 3.1）
- [ ] **接口 I 前缀**：所有 `interface` 必须以大写 `I` 开头（CLAUDE.md 四）
- [ ] **明确类型标注**：变量、参数、返回值必须有类型标注（宪法 3.1）
- [ ] **API 响应安全**：外部数据用 `unknown` 接收 + 类型守卫，不假设结构

### 二、Vue 3 组件模式

- [ ] **SFC 块顺序**：`<template>` → `<script setup>` → `<style>`（CLAUDE.md 二）
- [ ] **组合式写法**：使用 `<script setup lang="ts">`，禁止 Options API（宪法 5.3）
- [ ] **Props 类型声明**：`defineProps` 使用 TypeScript 泛型语法，非运行时声明
- [ ] **Emits 类型声明**：`defineEmits` 使用类型语法，事件参数明确
- [ ] **事件函数命名**：以 `on` 开头（如 `onSubmit`），禁止 `handle` 前缀（CLAUDE.md 五）
- [ ] **组件命名**：需缓存的页面组件必须 `defineOptions({ name: 'XxxPage' })`（CLAUDE.md 八）
- [ ] **模板简洁**：模板中禁止复杂表达式和业务逻辑，抽到 script 或 computed

### 三、组件组织

- [ ] **目录结构**：组件按名单独建目录，不平铺在 components/ 下（CLAUDE.md 三）
- [ ] **文件命名**：组件实现文件 `index.vue`，样式文件 `index.module.less`（CLAUDE.md 三）

### 四、Pinia 状态管理

- [ ] **Setup Store 模式**：使用 `defineStore('name', () => { ... })` 写法
- [ ] **禁止直接解构**：store 状态必须通过 `storeToRefs()` 解构，actions 可直接解构
- [ ] **模块内聚**：不同业务领域的状态归入不同 store，不混合（宪法 4.1）

### 五、样式与移动端

- [ ] **CSS Modules**：使用 Less + CSS Modules（`.module.less`），通过 `import styles from './index.module.less'` 引入（CLAUDE.md 六）
- [ ] **移动端适配**：禁止硬编码 `px`（1px 边框除外），使用 `vw`/`rem`（宪法 6.2）
- [ ] **安全区域**：考虑 `safe-area-inset`（宪法 6.2）

### 六、逻辑组织

- [ ] **Composable 拆分**：组件内响应式声明超过 3 个时，按职责拆分为 Composable（宪法 5.1）
- [ ] **命名规范**：Composable 以 `use` 开头，文件名与函数名一致（宪法 5.1）
- [ ] **工具库优先**：通用能力（防抖、节流、本地存储等）优先用 `@vueuse/core`（宪法 5.2）

### 七、工程规范

- [ ] **YAGNI**：只实现当前需求要求的功能，不为未来预留代码（宪法 1.1）
- [ ] **库优先**：不引入与已有库功能重叠的新依赖（宪法 1.2）
- [ ] **显式状态传递**：通过 props/事件/store 通信，禁止全局变量传状态（宪法 3.2）
- [ ] **懒加载默认**：路由级代码分割、组件懒加载是默认行为（宪法 6.1）

## 输出格式

对每个发现的问题，按以下格式输出：

```
[级别] 简要描述

文件路径:行号：问题描述。

原因：为什么这是个问题。
建议：具体修复方式（含代码示例）。
```

**级别定义：**
- **[必须修复]** — 违反宪法/CLAUDE.md 铁律，不修不能合
- **[建议修改]** — 最佳实践问题、可维护性、性能隐患
- **[仅供参考]** — 命名优化、风格建议、替代方案

**审查结束时给出总结：**
1. 整体评价（一句话）
2. 各级别问题数量统计
3. 建议的修改优先级
