# scaffold-builder

Claude Code Skill — 在空项目目录中搭建 Vue 3 移动端 H5 脚手架。

## 功能

按 11 个步骤自动生成完整的项目结构、配置文件、入口文件、路由、状态管理、网络层和 Git 规范，最终生成可运行的项目。

## 技术栈

Vue 3.5 + TypeScript 5 + Vite 8 + Vant 4 + Pinia 3 + Vue Router 4 + vue-request + @vueuse/core + Less + CSS Modules + Axios

## 使用方式

1. 将 `.claude/skills/scaffold-builder/` 目录复制到空项目根目录下
2. 在 Claude Code 中执行 `/scaffold-builder`

## 前提条件

- pnpm
- 空项目目录（或仅有 `package.json` 的目录）

## 目录结构

```
scaffold-builder/
├── SKILL.md                        # 执行流程定义
├── README.md                       # 本文件
└── reference/
    └── vue3-architecture.md        # 详细配置参考手册
```
