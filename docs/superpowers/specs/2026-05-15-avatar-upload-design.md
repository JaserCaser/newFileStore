# 头像上传功能设计

**日期：** 2026-05-15  
**范围：** `src/features/profile/`

## 目标

在用户个人资料页增强头像修改体验，支持两种方式：本地图片上传（转 base64 持久化）和 URL 拉取。原有纯文本 URL 输入字段废弃，统一入口改为点击头像区域弹出选择器。

---

## 组件结构

### 新建 `AvatarEditor.tsx`

独立组件，负责头像的展示和编辑入口，替换 `ProfilePage` 中原有"头像 URL" `ProfileField`。

**Props：**
```ts
type AvatarEditorProps = {
  value: string          // 当前 avatar（URL 或 base64 data URL）
  initials: string       // 无头像时的文字 fallback
  onChange: (value: string) => void
}
```

**内部状态：**
- `open: boolean` — 浮层是否展开
- `urlInput: string` — URL 输入框草稿值
- `urlInputVisible: boolean` — URL 子面板是否展开
- `imgError: boolean` — 图片加载失败标记

### 浮层结构（`AvatarPickerPopover`）

绝对定位在头像下方，内含三个操作项：

| 操作 | 触发 | 条件 |
|------|------|------|
| 📁 上传本地照片 | 触发隐藏的 `<input type="file" accept="image/*">` | 始终显示 |
| 🔗 输入图片 URL | 展开内联 URL 输入框 | 始终显示 |
| 🗑️ 移除头像 | 清空 avatar 值 | 仅当 `value` 非空时显示 |

点击浮层外部关闭（`useEffect` + `mousedown` 事件监听）。

---

## 交互细节

- **本地上传：** 选择文件后立即用 `FileReader.readAsDataURL()` 转换，调用 `onChange(base64)` 更新预览；用户仍需点「保存资料」才写入 `updateProfile`。
- **文件大小限制：** 超过 **2MB** 时不写入 state，显示 Toast 错误："图片不能超过 2MB，请选择更小的文件"。
- **URL 输入：** 展开后显示 input，内置 **600ms 防抖**，超时后调用 `onChange(url)` 触发预览刷新。
- **图片加载失败：** 显示文字 fallback（现有逻辑），并将 `imgError` 置 true。
- **Camera overlay：** 移除原有 `title` tooltip（不再需要），添加 `cursor: pointer`，点击委托给头像区域的点击事件。

---

## 数据流

```
本地上传:
  选择文件 → FileReader.readAsDataURL() → onChange(base64)
           → form.avatar = base64 → 保存 → updateProfile → localStorage

URL 输入:
  输入文字 → 防抖 600ms → onChange(url) → form.avatar = url
           → 保存 → sanitizeAvatarUrl() 验证 → updateProfile → localStorage
```

---

## `sanitizeAvatarUrl` 变更

当前只放行 `http://` / `https://`，需要同时放行 `data:image/` 开头：

```ts
function sanitizeAvatarUrl(value: string): string {
  const url = value.trim()
  const normalized = url.toLowerCase()
  if (normalized.startsWith('data:image/')) return url
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return url
  return ''
}
```

---

## 文件变更范围

| 文件 | 操作 |
|------|------|
| `src/features/profile/AvatarEditor.tsx` | **新建** |
| `src/features/profile/ProfilePage.tsx` | 修改：引入 AvatarEditor，移除"头像 URL" ProfileField，移除 `avatarLoadFailed` state（移入 AvatarEditor） |
| `src/features/profile/ProfilePage.css` | 修改：头像区域加 `cursor: pointer` 和 hover 效果，浮层样式 |

`types.ts`、`AuthProvider.tsx`、`mock-service.ts` **不需要改动**。

---

## 不在范围内

- 图片裁剪 / crop 功能
- 后端上传接口对接
- 头像历史记录
