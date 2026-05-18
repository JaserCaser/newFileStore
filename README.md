<div align="center">

# 🌌 Personal FileStore (个人FileStore)

✨ *A modern, elegant, and secure personal file management system.* ✨

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.0-purple?style=for-the-badge&logo=vite)
![Vitest](https://img.shields.io/badge/Vitest-4.1-green?style=for-the-badge&logo=vitest)

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Architecture](#architecture)

</div>

---

## 📖 Introduction

**Personal FileStore** 是一款专为个人打造的现代化文件存储与管理系统。它不仅提供了安全可靠的文件云端托管，还融入了犹如 Apple 般极简优雅的 UI 交互体验。系统巧妙地将**用户前台（App）**与**运营后台（Admin）**分离，支持双模式独立运行与管理，为你的数字生活带来极致的流畅感。

## 🚀 Features

- 🍎 **Apple-like 极致体验**：精心打磨的极简登录页与微动效，享受丝滑的交互体验。
- 🛡️ **双端架构设计**：完全独立的前台个人空间（App）与运营管理后台（Admin），一套代码，双重入口。
- 📁 **全能文件管家**：支持文件上传、下载、移动、重命名及自定义右键菜单等核心操作。
- 🤖 **AI 赋能应用**：集成前沿的 AI 图像处理功能（AI Image），让文件管理更智能。
- 🎨 **个性化专属空间**：支持个人资料深度配置、内置高级自定义头像裁剪与上传编辑器。
- 📱 **全端响应式**：完美适配桌面端与移动端屏幕，随时随地管理你的数字资产。

## 🛠️ Tech Stack

本项目采用最前沿的前端技术栈构建，秉承高标准的工程化规范：

- **Core**: React 19 + TypeScript 6.0
- **Build Tool**: Vite 8.0 (带来闪电般的冷启动与热更新体验)
- **Styling**: 原生 CSS + 现代响应式布局 + 硬件加速动效
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library (全方位工程质量保障)
- **Lint & Format**: ESLint 10 + Prettier 3

## ⚙️ Getting Started

### 1. 克隆与依赖安装

```bash
git clone https://github.com/your-username/personal-filestore.git
cd personal-filestore
npm install
```

### 2. 启动开发服务器

系统支持同时或分别运行前台应用和管理后台。

**启动前台应用 (App):**
```bash
npm run dev:app
# 或使用快捷命令
npm run dev
```

**启动管理后台 (Admin):**
```bash
npm run dev:admin
```

> **💡 Tip:** 项目根目录下还为您提供了便捷的 Windows 启动脚本：`一键启动.bat`、`一键启动全部.bat` 以及 `启动运营后台.bat`，双击即可快速启动相应服务。

### 3. 构建与预览

**生产环境构建:**
```bash
npm run build:app    # 仅构建前台产物
npm run build:admin  # 仅构建后台产物
```

**本地预览生产级产物:**
```bash
npm run preview:app
npm run preview:admin
```

## 🏗️ Architecture & Structure

项目遵循 `Feature-Sliced Design` 思想，目录结构清晰可维护：

```text
personal-filestore/
├── src/
│   ├── features/               # 按业务功能划分的模块
│   │   ├── auth/               # 认证与登录 (Apple-like 风格)
│   │   ├── file-manager/       # 核心文件管理 (列表、菜单、对话框等)
│   │   ├── profile/            # 个人资料与头像编辑器
│   │   ├── ai-image/           # AI 图像生成与处理模块
│   │   └── operations/         # 管理后台专属操作模块
│   ├── domain/                 # 领域层类型定义与核心通用逻辑
│   ├── data/                   # 数据层 (API 接口与 Mock 数据)
│   ├── assets/                 # 静态图片与全局资源
│   ├── App.tsx & main.tsx      # 前台应用入口点
│   └── AdminApp.tsx & main.admin.tsx # 后台应用入口点
├── docs/                       # 设计草案与版本演进文档
├── public/                     # 视频背景、图标等公用静态资源
├── test/                       # 测试环境全局 Setup 配置
└── vite.config.ts              # Vite 双应用模式构建配置
```

## 🧪 Testing & Quality

我们极度重视代码质量与系统稳定性，配备了完善的测试套件与代码规范检查：

```bash
npm run test        # 运行所有 Vitest 单元与组件测试用例
npm run test:watch  # 以 Watch 模式运行测试 (TDD 推荐)
npm run lint        # 执行 ESLint 静态代码分析
npm run format      # 使用 Prettier 一键格式化代码库
npm run typecheck   # 执行严格的 TypeScript 类型检查
```

---

<div align="center">
  <p>Made with ❤️ by an enthusiast developer.</p>
</div>
