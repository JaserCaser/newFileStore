# 个人FileStore

个人FileStore 是一个面向个人文件存储与管理的系统，规划分为前台和后台。当前应用先作为前台端登录页；后台应使用独立端口和独立页面入口。

## 当前进度

- Apple-like 风格登录页
- 前台个人空间登录页
- 账号、密码、保持登录、忘记密码入口
- 响应式布局
- TypeScript、ESLint、Prettier、Vitest 基础工程规范

## 目录结构

```text
src/
  features/auth/    登录与认证相关页面
  test/             测试环境配置
```

## 常用脚本

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run format
```
