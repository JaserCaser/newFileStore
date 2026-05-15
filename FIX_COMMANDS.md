# 快速修复命令

**使用方法**: 复制以下命令到终端执行，或提交给 Codex 自动修复

---

## 方案 A: 完整修复（推荐）

```bash
# 进入项目目录
cd "e:\新文件系统"

# 1. 修复 ESLint 错误
## 1.1 interface -> type
sed -i 's/^interface FileItem {/type FileItem = {/' src/features/file-manager/FileManagerPage.tsx

## 1.2 删除未使用的 isFolder 变量（第147行）
sed -i '147d' src/features/file-manager/FileManagerPage.tsx

## 1.3 || -> ??
sed -i 's/file\.size || '\''-'\''/file.size ?? '\''-'\''/' src/features/file-manager/FileManagerPage.tsx

# 2. 删除未使用的 CSS 类
sed -i '/^\.sr-only {/,/^}/d' src/index.css

# 3. 运行格式化
npm run format

# 4. 验证
npm run lint
npm run typecheck
```

---

## 方案 B: 仅修复阻塞构建的问题

```bash
cd "e:\新文件系统"

# 如果 FileManagerPage 暂不需要，临时注释掉 App.tsx 中的引用
# 手动修改 src/App.tsx：
# - 注释掉 import { FileManagerPage }
# - 修改条件渲染逻辑

# 然后运行
npm run lint -- --fix
npm run build
```

---

## 逐项修复（精确控制）

### 修复 1: interface -> type

**文件**: `src/features/file-manager/FileManagerPage.tsx`
**行号**: 18

```bash
sed -i '18s/interface FileItem {/type FileItem = {/' src/features/file-manager/FileManagerPage.tsx
```

### 修复 2: 删除未使用变量

**文件**: `src/features/file-manager/FileManagerPage.tsx`
**行号**: 147

```bash
sed -i '147d' src/features/file-manager/FileManagerPage.tsx
```

### 修复 3: 空值合并运算符

**文件**: `src/features/file-manager/FileManagerPage.tsx`
**行号**: 179

```bash
sed -i '179s/file\.size || '\''-'\''/file.size ?? '\''-'\''/' src/features/file-manager/FileManagerPage.tsx
```

### 修复 4: 删除未使用 CSS

**文件**: `src/index.css`
**行号**: 52-61

```bash
sed -i '52,61d' src/index.css
```

---

## 验证命令

```bash
# 类型检查
npm run typecheck

# Lint 检查
npm run lint

# 格式检查
npm run format:check

# 运行测试
npm run test

# 构建
npm run build
```

---

## Codex 提交模板

如果使用 Codex 自动修复，请使用以下提示词：

```
请修复以下代码审计发现的问题：

1. src/features/file-manager/FileManagerPage.tsx 第18行：将 interface FileItem 改为 type FileItem
2. src/features/file-manager/FileManagerPage.tsx 第147行：删除未使用的 isFolder 变量
3. src/features/file-manager/FileManagerPage.tsx 第179行：将 || 替换为 ??
4. src/index.css 第52-61行：删除未使用的 .sr-only 类定义

修复后请运行 npm run lint 和 npm run typecheck 验证。
```
