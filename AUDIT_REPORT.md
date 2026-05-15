# 代码审计记录

**审计时间**: 2026-05-14
**项目**: personal-filestore
**技术栈**: React 19 + TypeScript 6 + Vite 8

---

## 审计进度总览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| TypeScript 类型检查 | ✅ 通过 | 无类型错误 |
| ESLint 代码规范 | ✅ 通过 | 无 lint 错误 |
| 单元测试 | ✅ 通过 | 20/20 测试用例 |
| 生产构建 | ✅ 通过 | 构建成功（JS 254 kB / CSS 37 kB） |
| 行数约束（< 500 行） | ✅ 通过 | 最大文件 `FileManagerPage.tsx` 495 行 |

---

## 本次审计内容：个人信息页面功能（v1.5）

### 新增/变更文件清单

| 文件 | 状态 | 行数 |
|------|------|------|
| `src/features/profile/ProfilePage.tsx` | **新增** | 267 |
| `src/features/profile/ProfilePage.css` | **新增** | 343 |
| `src/features/auth/AuthProvider.tsx` | 变更 | 108 |
| `src/features/auth/auth-context.ts` | 变更 | 17 |
| `src/features/auth/types.ts` | 变更 | 43 |
| `src/features/file-manager/FileManagerPage.tsx` | 变更 | 495 |
| `src/features/file-manager/components/FileListParts.tsx` | **新增** | 217 |
| `src/App.tsx` | 变更 | 40 |

---

## 设计优点

1. **低耦合**：ProfilePage 通过 `useAuth()` 获取 `updateProfile`，FileManagerPage 仅接收 `user`/`onOpenProfile` props，不直接依赖认证上下文，单测可独立渲染。
2. **类型安全**：`ProfileFormState` 精确 Pick + Required，表单状态初始化使用 `user?.field ?? ''` 无空指针风险。
3. **存储一致性**：新增 `updateStoredUser()` 正确处理 localStorage / sessionStorage 双场景，登录时选哪个存储，更新时同步回写哪个。
4. **文件拆分合理**：FileListParts.tsx 抽取后 217 行，FileManagerPage.tsx 从 600+ 行压缩至 495 行，符合行数约束。
5. **响应式设计**：ProfilePage.css 做了 860px / 620px 两档断点，平板/手机布局均有处理。

---

## 问题清单（需 Codex 修复）

### P1 — 安全性

#### 1. 头像 URL 未校验（ProfilePage.tsx:104-105）

**问题**：`<img src={form.avatar}>` 直接渲染用户输入的 URL，若用户输入 `javascript:alert(1)` 等伪协议 URL，存在 XSS 风险。同时无 `onError` 回调，URL 失效时图片会显示为空白破图。

**建议修复**：
- 在保存时校验 URL：仅允许 `https://` 或 `http://` 开头的 URL；
- 添加 `onError={(e) => e.currentTarget.style.display = 'none'}` 或在 onError 中切换为 fallback initials 展示。

```tsx
// 校验示例
const isValidAvatarUrl = (url: string) =>
  url === '' || /^https?:\/\/.+/.test(url)
```

---

### P2 — 测试覆盖

#### 2. 新增功能无测试覆盖（P1 测试缺失）

**问题**：ProfilePage 新增整个页面，AuthProvider 新增 `updateProfile` 方法，FileManagerPage 新增头像入口按钮，但测试用例总数仍为 20 个，无新增测试。

**建议补充测试**：
- `ProfilePage` 渲染测试：验证表单字段、初始值填充、完整度计算
- `updateProfile` 测试：验证资料更新后 localStorage/sessionStorage 同步
- `onOpenProfile` 回调测试：FileManagerPage 头像按钮点击触发回调
- 头像 URL 校验后的边界测试

---

### P3 — 代码质量（可选优化）

#### 3. `updateProfile` 在 setAuthState updater 内执行副作用（AuthProvider.tsx:89-97）

**问题**：`updateStoredUser()` 是 localStorage 写操作，放在 state updater 函数内违反 React 19 Strict Mode 的纯函数要求（React 可能调用 updater 两次以检测副作用）。

**建议**：将存储写操作移到 updater 外部：

```tsx
const updateProfile = useCallback((profile: UserProfileUpdate): User | null => {
  let nextUser: User | null = null

  setAuthState((current) => {
    if (!current.user || !current.token) return current
    nextUser = { ...current.user, ...profile }
    return { ...current, user: nextUser }
  })

  if (nextUser && authState.token) {
    updateStoredUser(nextUser, authState.token)
  }

  return nextUser
}, [authState.token])
```

#### 4. ProfilePage 缺少 `onError` 头像降级处理（ProfilePage.tsx:105）

**问题**：头像 URL 有效但图片加载失败时（404、网络错误），页面会显示空白/破裂图片图标，用户体验差。

**建议**：增加 `onError` 状态，加载失败时回退到 initials 展示。

#### 5. 头像上传入口仅有图标无功能（ProfilePage.tsx:109-111）

**问题**：`.profile-camera` 相机图标暗示可点击上传，但实际没有绑定任何事件，用户可能误以为可以上传头像文件。

**建议**：要么隐藏该图标（仅在有上传功能时显示），要么添加 `title="请输入头像 URL"` 提示文字，降低用户预期。

---

## 审计历史

| 日期 | 版本 | 审计内容 | 结果 |
|------|------|----------|------|
| 2026-05-14 | v1.0 | 全量审计 | 发现 6 个问题 |
| 2026-05-14 | v1.1 | 文件管理页面审计 | 修复 2 个 ESLint 错误 |
| 2026-05-14 | v1.2 | 测试修复 | 修复测试 AuthProvider 问题 |
| 2026-05-14 | v1.3 | 功能完善 | 补充测试、CSS 拆分、新增功能 |
| 2026-05-14 | v1.4 | 注册功能完善 | 修复 ESLint 错误、新增拖拽验证 |
| 2026-05-14 | v1.5 | 个人信息页面 | 发现 5 个问题（1 安全 / 1 测试 / 3 优化） |
| 2026-05-15 | v1.6 | 登录页重构 + 测试补充 | 发现 5 个问题（1 功能 / 2 质量 / 2 优化） |
| 2026-05-15 | v1.7 | 最近使用 / 照片 / Office 文档三视图 | 发现 5 个问题（1 测试 / 3 逻辑 / 1 设计） |
| 2026-05-15 | v1.6 修复确认 | 登录页重构遗留 5 问题 | 全部修复 ✅ |
| 2026-05-15 | v1.7 修复确认 | 三视图遗留 5 问题 | 全部修复 ✅ |
| 2026-05-15 | v1.8 | 运维端页面大修 + 端口分离 | 发现 5 个问题（1 安全 P1 / 2 功能 P2 / 2 质量 P3） |
| 2026-05-15 | v1.8 修复确认 | 运维端 5 问题 | 全部修复 ✅ |

---

## 本次审计内容：登录页重构与测试补充（v1.6）

### v1.5 问题修复确认

| 编号 | 问题 | 状态 |
|------|------|------|
| v1.5-P1 | 头像 URL XSS 风险 | ✅ 已修复：`sanitizeAvatarUrl()` 限定 http/https |
| v1.5-P2 | ProfilePage 无测试覆盖 | ✅ 已修复：新增 5 个测试用例，含 XSS 边界场景 |
| v1.5-P3-1 | `updateProfile` updater 内执行副作用 | ✅ 已修复：存储写操作已移到 updater 外（但见新 P2） |
| v1.5-P3-2 | 头像 `onError` 降级缺失 | ✅ 已修复：`avatarLoadFailed` 状态 + initials 回退 |
| v1.5-P3-3 | 相机图标无功能无提示 | ✅ 已修复：添加 `title` 提示文字 |

### 新增/变更文件清单

| 文件 | 状态 | 行数 |
|------|------|------|
| `src/features/auth/LoginPage.tsx` | 重构 | 379 |
| `src/features/auth/PasswordField.tsx` | **新增** | 50 |
| `src/features/auth/RegisterForm.tsx` | **新增** | 195 |
| `src/features/auth/LoginPage.legacy.css` | **新增** | — |
| `src/features/auth/LoginPage.modern.css` | **新增** | — |
| `src/features/auth/LoginPage.controls.css` | **新增** | — |
| `src/features/auth/LoginPage.motion.css` | **新增** | — |
| `src/features/file-manager/FileManagerPage.motion.css` | **新增** | — |
| `src/App.test.tsx` | **新增** | 37 |
| `src/features/profile/ProfilePage.test.tsx` | **新增** | 153 |
| `src/features/auth/LoginPage.test.tsx` | 扩充 | 138 |

---

## 设计优点（v1.6）

1. **CSS 分层清晰**：LoginPage 样式按关注点拆为 `legacy` / `modern` / `controls` / `motion` 四层，各自独立，互不污染。
2. **inert 无障碍处理**：翻转卡片用 `inert` 属性阻止隐藏面的键盘焦点，符合 WCAG 可访问性要求，且是 React 19 原生支持的写法。
3. **拖拽验证设计合理**：`HumanVerification` 组件通过隐藏 `input[name="humanVerified"]` 将验证状态序列化进 FormData，无需额外状态提升，服务端同样可校验。
4. **Fisher-Yates shuffle 实现正确**：`shuffle()` 从尾向头交换，复杂度 O(n)，无偏分布。
5. **测试覆盖大幅提升**：新增 App 级别历史导航测试、ProfilePage 完整交互测试，测试数量从 20 增至 30+。

---

## 问题清单（v1.6，需 Codex 修复）

### P1 — 功能缺陷

#### 1. 注册邮箱字段数据被静默丢弃（RegisterForm.tsx:98-101 / LoginPage.tsx:51-59）

**问题**：`RegisterForm` 渲染了"绑定邮箱（可选）"输入框，但 `handleRegisterSubmit` 从未读取 `formData.get('email')`，且 `RegisterParams` 类型中也没有 `email` 字段。用户填写后数据直接丢失，无任何提示。`LoginPage.test.tsx:67` 验证了该字段确实渲染，进一步说明这是个遗漏而非刻意设计。

**建议修复**（二选一）：
- 将 email 纳入 `RegisterParams` 和 `registerUser()` 参数并保存到用户记录；
- 或直接删除该字段（若本次不实现邮箱功能），避免用户预期落空。

---

### P2 — 代码质量

#### 2. `updateProfile` updater 内使用了闭包中的过期 `authState.token`（AuthProvider.tsx:90）

**问题**：v1.5 审计建议在 updater 内使用 `current.token` 做守卫，而当前实现仍用 `authState.token`（来自 `useCallback` 的依赖项闭包），当 token 在 updater 执行前恰好变化时，守卫判断会基于旧值，可能导致以下情况：用户已登出（token 变为 null）但 updater 仍用旧 token 非空通过守卫并写入存储。

```tsx
// 当前（有隐患）
setAuthState((current) => {
  if (!current.user || !authState.token) return current   // authState.token 可能是旧值
  ...
})

// 建议修复
setAuthState((current) => {
  if (!current.user || !current.token) return current     // current 保证是最新状态
  ...
})
```

#### 3. "忘记密码"是死链接，点击触发全页 404（LoginPage.tsx:339）

**问题**：`<a href="/forgot-password">忘记密码？</a>` 是普通 `<a>` 标签，点击后触发全页跳转，浏览器会离开 SPA 并命中 404（Vite 开发服务器会返回 404，Nginx 未配置 fallback 时生产环境也会）。

**建议修复**：

```tsx
// 改为按钮，暂时禁用或弹出 toast 提示
<button type="button" className="forgot-password-link" disabled>
  忘记密码？
</button>
```

---

### P3 — 测试质量 / 体验优化

#### 4. 测试断言中含字符编码乱码（ProfilePage.test.tsx:109）

**问题**：正则 `/淇濆瓨|保存/` 中 `淇濆瓨` 是 `保存` 在某编码错误下的乱码（三个无关汉字），测试当前靠 `|保存` 分支通过，但乱码部分会造成混淆，应清理。

```tsx
// 当前（含乱码）
await user.click(screen.getByRole('button', { name: /淇濆瓨|保存/ }))

// 修复
await user.click(screen.getByRole('button', { name: '保存资料' }))
```

#### 5. 登录/注册共享 `loading` 状态但无过渡提示（LoginPage.tsx:17-19）

**问题**：`loading` 是登录与注册共享的单一状态。用户若在登录请求进行中切换到注册模式，会看到注册表单中所有输入框和按钮全部禁用，却没有任何文字说明原因，体验令人困惑。

**建议**：将 `loading` 拆为 `loginLoading` / `registerLoading` 独立管理，或在共享禁用时添加 `title="请等待当前操作完成"` 说明。

---

---

## 本次审计内容：最近使用 / 照片 / Office 文档三视图（v1.7）

### 新增/变更文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/features/file-manager/api/types.ts` | 变更 | 新增 `FileCollectionView` 联合类型 |
| `src/features/file-manager/api/mock-service.ts` | 变更 | 新增 `isOfficeDocument()`，`listFiles` 增加三视图分支 |
| `src/features/file-manager/hooks/useFileManager.ts` | 变更 | 新增 `activeView` 状态、`setActiveView` 方法、视图切换重置逻辑 |
| `src/features/file-manager/FileManagerPage.tsx` | 变更 | 新增侧边栏导航、`VIEW_META`、`handleSwitchView`、`canCreateFolder` |
| `src/features/file-manager/components/FileListParts.tsx` | 变更 | `EmptyState` 新增 `view` prop 及各视图空状态文案 |
| `src/features/file-manager/FileManagerPage.test.tsx` | 变更 | 新增 3 个视图切换测试用例 |

---

### 设计优点（v1.7）

1. **接口扩展干净**：`FileCollectionView` 加入 `FileListParams.view`，视图切换对 `FileService` 接口透明，未来替换真实 API 只需实现同一签名。
2. **`isOfficeDocument` 双重校验**：同时校验扩展名和 MIME type，能兼容 mimeType 信息缺失或扩展名不标准的场景，逻辑严谨。
3. **视图切换时状态自动重置**：`setActiveView` 内一次性清空 `currentParentId / page / keyword / selectedIds`，避免旧状态污染新视图。
4. **`canCreateFolder` 守卫正确**：`canCreateFolder = activeView === 'all'`，非根视图下禁用"新建文件夹"按钮并附 `title` 说明，符合语义。
5. **面包屑 root 转换正确**：`Breadcrumb.tsx:15` 用 `item.id === 'root' ? null : item.id` 将虚拟 root id 转为 `null`，避免 `navigateTo('root')` 导致空列表，路径已验证。
6. **三视图均有测试**：每个视图有独立测试用例，验证正面内容出现 + 应排除内容不存在。

---

### 问题清单（v1.7，需 Codex 修复）

#### P1 — 测试覆盖

##### 1. 三视图均未验证"新建文件夹"按钮禁用状态（FileManagerPage.tsx:234）

**问题**：`canCreateFolder = activeView === 'all'` 确保非全部文件视图下"新建文件夹"禁用，但现有测试均未覆盖此约束。如果该逻辑被意外改动，测试不会报错，功能静默退化。

**建议补充**：

```ts
it('disables the create folder button when not in all-files view', async () => {
  const user = userEvent.setup()
  renderFileManager()

  await user.click(screen.getByRole('button', { name: /最近使用/ }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '新建文件夹' })).toBeDisabled()
  )

  await user.click(screen.getByRole('button', { name: /照片/ }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '新建文件夹' })).toBeDisabled()
  )
})
```

---

#### P2 — 逻辑问题

##### 2. `recent` 视图下关键字搜索范围仅限 top-24，而非全量（mock-service.ts:223-239）

**问题**：`recent` 视图先 `.slice(0, 24)` 取最近24个文件，关键字搜索随后只在这24个中进行（`source = items`）。而 `photos` / `office` 视图的关键字搜索在各自全量集合上进行。结果不一致：若用户在"最近使用"中搜索一个确实被最近修改但排在第25位的文件，会搜不到。

**建议修复**：`recent` 视图有关键字时，在全量非文件夹集合中搜索，再按 modifiedAt 排序展示，不做数量截断；无关键字时才取 top-24。

```ts
if (params.view === 'recent') {
  const allNonFolders = this.files
    .filter((f) => f.type !== 'folder')
    .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())

  items = params.keyword ? allNonFolders : allNonFolders.slice(0, 24)
}
```

##### 3. `listFiles` 对非 `all` 视图执行了无效的 parentId 前置过滤（mock-service.ts:221）

**问题**：第一行 `let items = this.files.filter((f) => f.parentId === (params.parentId ?? null))` 对所有视图无条件执行，在 `recent / photos / office` 视图下其结果立刻被 if-else 分支覆盖丢弃，属于死代码路径。现在无害，但随着视图增加，前置过滤逻辑和视图分支逻辑的意图会愈发混淆。

**建议修复**：将 parentId 过滤移入 `all` 视图分支，结构更清晰：

```ts
let items: FileItem[]

if (params.view === 'recent') {
  items = [...]
} else if (params.view === 'photos') {
  items = this.files.filter((f) => f.type === 'image')
} else if (params.view === 'office') {
  items = this.files.filter((f) => isOfficeDocument(f))
} else {
  // 'all' 或未指定：按 parentId 浏览文件夹
  items = this.files.filter((f) => f.parentId === (params.parentId ?? null))
}
```

##### 4. `recent` 视图的排序语义与 `photos` / `office` 不一致（FileManagerPage.tsx:165 + mock-service.ts:224-226）

**问题**：`recent` 视图先在 mock-service 内按 modifiedAt 排序并截断至24条，随后外部 sort 参数再次排序（名称 / 大小等）。效果是"24个最近文件按所选字段排"。而 `photos` / `office` 视图是先取全量集合再排序，无截断。当用户在 `recent` 视图点击"名称"排序按钮时，看到的是"24个最近修改的文件按名称顺序"，而不是"名称最靠前的最近文件"。此逻辑对用户不直观，且与另外两个视图行为不一致。

**建议**：若 `recent` 视图下用户主动更改排序字段，取消 top-24 上限（或提示"当前仅展示最近 24 条"），与 `photos` / `office` 行为对齐。

---

#### P3 — 设计

##### 5. `recent` 条数上限（24）与 `pageSize`（50）各自硬编码，维护点分离（mock-service.ts:226 / useFileManager.ts:82）

**问题**：`.slice(0, 24)` 写死在 mock-service，`pageSize = 50` 写死在 useFileManager，二者无关联。将来修改分页大小或 recent 上限时需分别修改两处，容易漏改，且从 service 层反向决定了视图的展示数量，职责不清。

**建议**：将 recent 的上限通过 `params.pageSize` 传入（`useFileManager` 对 recent 视图传 `pageSize: 24`），mock-service 直接用 `params.pageSize ?? 24` 截断，统一由调用方控制数量。

---

---

## 本次审计内容：运维端页面大修 + 端口分离（v1.8）

### 新增/变更文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/features/operations/OperationsAdminPage.tsx` | **新增** | 运维后台主页：账号准入、系统配置、审计日志 |
| `src/features/operations/OperationsAdminPage.css` | **新增** | 运维页样式 |
| `src/features/auth/admin-config.ts` | **新增** | 运维数据层：用户目录、权限管理、审计日志、配置 |
| `src/AdminApp.tsx` | **新增** | 管理端 SPA 入口（含路由守卫） |
| `src/main.admin.tsx` | **新增** | 管理端渲染入口 |
| `vite.config.ts` | 重构 | 双入口构建配置（用户端 5137 / 运维端 5000） |

### v1.6 问题修复确认 ✅

| 编号 | 问题 | 修复验证 |
|------|------|----------|
| v1.6-1 | 注册邮箱数据丢弃 | `LoginPage.tsx:68` 读取 email，`:82` 传入 `register()`，`RegisterParams` 已含 `email?` |
| v1.6-2 | updater 内使用闭包旧 token | `AuthProvider.tsx:96` 改为 `current.token`，`useCallback` 依赖数组为 `[]` |
| v1.6-3 | "忘记密码"死链 | `LoginPage.tsx:412` 改为 `<button ... disabled>忘记密码？</button>` |
| v1.6-4 | 测试断言含乱码 | `ProfilePage.test.tsx:110` 改为精确字符串 `'保存资料'` |
| v1.6-5 | 共享 loading 状态 | `LoginPage.tsx:27-28` 拆为 `loginLoading` / `registerLoading` 独立状态 |

### v1.7 问题修复确认 ✅

| 编号 | 问题 | 修复验证 |
|------|------|----------|
| v1.7-1 | 三视图未测试"新建文件夹"禁用 | 新增两个测试用例（行 122、157），第二个用例额外覆盖切回全部文件后按钮重新启用 |
| v1.7-2 | recent 搜索仅限 top-24 | `isDefaultRecentSort()` 辅助函数判断：有关键字或非默认排序时取消截断，全量搜索 |
| v1.7-3 | 前置 parentId 过滤死代码 | 重构为干净的 `if-else if-else` 结构，`let items: FileItem[]` 在各分支内分别赋值 |
| v1.7-4 | recent 排序语义不一致 | `useRecentPreview = !keyword && isDefaultRecentSort(sort)`，非预览模式不截断 |
| v1.7-5 | 上限与 pageSize 各自硬编码 | `useFileManager.ts:81` 提取 `RECENT_PREVIEW_PAGE_SIZE = 24`，`:136` 传入服务层；`mock-service.ts:241` 使用 `params.pageSize ?? 24` |

---

### 设计优点（v1.8）

1. **端口双入口架构清晰**：`vite.config.ts` 通过 `mode` 参数和 Vite 插件在 HTML 转换阶段替换入口脚本，无运行时判断，构建产物完全分离（`dist/app` / `dist/admin`），互不干扰。
2. **`AdminApp` 路由守卫设计合理**：`isAuthenticated && !canAccessAdmin` 时同步渲染 `null`，异步触发 `logout`，既不闪烁管理界面，也没有递归渲染问题；`popstate` / `hashchange` 双事件监听确保浏览器前进/后退也会退出登录。
3. **`toPublicUser` 剥离敏感字段**：所有对外暴露 `User` 的路径都经过 `toPublicUser()`，`password` / `canAccessAdmin`（内部控制字段）不会意外泄露到组件层。
4. **`setUserStorageQuota` 数值钳夹**：`Math.min(500, Math.max(1, Math.round(storageQuotaGb)))` 防止 UI 输入异常值直接写入，健壮性好。
5. **审计日志设计完整**：权限授予/撤销、账号停用/启用、密码重置、配置变更均有对应日志条目，字段含 `actor`/`action`/`detail`/`level`，可读性强。
6. **super_admin 保护一致**：`setUserAdminAccess` / `setUserStatus` / `resetUserPassword` 均检查 `target.role === 'super_admin'` 并 early-return，UI 层同步用 `locked` 禁用操作按钮，前后端双重守卫。

---

### v1.8 问题修复确认 ✅

| 编号 | 问题 | 修复验证 |
|------|------|----------|
| v1.8-11 | 明文密码存储 | `UserDirectoryRecord` 改为 `passwordHash`；预计算 `SUPER_ADMIN_PASSWORD_HASH` 常量；`hashPassword()` 使用 `crypto.subtle`；`validateLogin` / `registerUser` / `resetUserPassword` 全部改为 async；新增 `loadStoredDirectory()` 迁移函数兼容旧 localStorage 数据 |
| v1.8-12 | `setUserStorageQuota` 缺 super_admin 守卫 | `:326` 改为 `if (!target \|\| target.role === 'super_admin') return users` |
| v1.8-13 | 临时密码无自动关闭 | `handlePasswordReset` 改为 async，`:127` 追加 `setTimeout(() => setNotice(null), 15_000)` |
| v1.8-14 | `Math.random()` 生成密码 | `:350-352` 改为 `crypto.getRandomValues(new Uint8Array(8))`，字符集去除易混淆字符 |
| v1.8-15 | `<a>` 未挂载直接 click | `:143-146` 添加 `appendChild` / `removeChild` 包裹 |

### 问题清单（v1.8，需 Codex 修复）

#### P1 — 安全

##### 1. 所有用户明文密码序列化存入 localStorage（admin-config.ts:75-83）

**置信度：8/10（经多轮独立过滤确认为真实问题）**

**问题**：`saveDirectory()` 将完整 `UserDirectoryRecord[]`（含 `password: string`）写入 `localStorage["filestore_user_directory"]`。任何与本页面同源执行的 JavaScript（浏览器扩展、未来引入的第三方脚本、或后续出现的 XSS）可通过一次调用取出所有账号的明文密码：

```ts
// 攻击者执行：
const dir = JSON.parse(localStorage.getItem('filestore_user_directory'))
dir.forEach(u => console.log(u.account, u.password))
```

这包括超级管理员账号 `admin / admin123`（每次启动由 `SUPER_ADMIN_RECORD` 强制写入，line 77）。

**建议修复**：密码不应落盘。认证时只需比对，可改为存储单向哈希（浏览器原生 `crypto.subtle.digest('SHA-256', ...)` 无需第三方库），存储和比对均使用哈希：

```ts
// 注册时
const hash = await hashPassword(password)
saveDirectory([...users, { ...user, passwordHash: hash }])

// 登录时
const ok = await verifyPassword(inputPassword, user.passwordHash)
```

若不想引入 async 哈希，最低限度应删除 `password` 字段后再序列化，认证逻辑改为"密码仅存 sessionStorage 且不持久化"。

---

#### P2 — 功能 / 体验

##### 2. `setUserStorageQuota` 缺少 super_admin 守卫（admin-config.ts:296-311）

**问题**：与 `setUserAdminAccess`、`setUserStatus`、`resetUserPassword` 不同，`setUserStorageQuota` 的守卫只检查 `if (!target) return users`，没有 `target.role === 'super_admin'` 保护。UI 层通过 `disabled={locked}` 禁用了超管行的容量输入框，但函数本身可被直接调用修改超管配额。与其他函数的防御模式不一致，属于遗漏。

**建议修复**：

```ts
if (!target || target.role === 'super_admin') return users
```

##### 3. 临时密码以明文长期显示在页面上（OperationsAdminPage.tsx:126-128）

**问题**：`handlePasswordReset` 触发后，临时密码通过 `setNotice(...)` 以明文字符串展示在橙色 notice 横幅中，无超时自动关闭，也无遮掩（`***`）。如果操作员离开屏幕，经过的任何人都能读到临时密码。

**建议修复**：
- 添加自动关闭（如 15 秒）：`window.setTimeout(() => setNotice(null), 15_000)`；
- 或改为仅展示一次确认弹窗（Dialog），关闭即清除。

---

#### P3 — 代码质量

##### 4. 临时密码使用 `Math.random()` 生成（admin-config.ts:323）

**问题**：`'Reset' + Math.random().toString(36).slice(2, 8)` 所用的 `Math.random()` 不是密码学安全的伪随机数生成器（CSPRNG），理论上可被同一 JS 引擎实例中的其他脚本预测。虽然在当前单机部署场景下风险极低，但在任何涉及密码生成的场景下都应使用 `crypto.getRandomValues()`。

**建议修复**：

```ts
const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789'
const arr = crypto.getRandomValues(new Uint8Array(8))
const password = Array.from(arr, (b) => chars[b % chars.length]).join('')
```

##### 5. `exportLogs` 创建未挂载的 `<a>` 元素后直接 `.click()`（OperationsAdminPage.tsx:139-143）

**问题**：规范要求触发下载的 `<a>` 元素应先 `document.body.appendChild(link)` 再 `click()`，最后 `removeChild(link)`，否则在部分浏览器（旧版 Firefox）中无法触发下载。虽然主流现代浏览器目前均可处理，但属于非规范写法。

**建议修复**：

```ts
document.body.appendChild(link)
link.click()
document.body.removeChild(link)
URL.revokeObjectURL(url)
```

---

### 架构说明（端口分离）

`vite.config.ts` 引入了双入口机制：

| 端口 | 入口 | 构建产物 | 用途 |
|------|------|----------|------|
| 5137 | `src/main.tsx` → `App` | `dist/app` | 用户文件管理端 |
| 5000 | `src/main.admin.tsx` → `AdminApp` | `dist/admin` | 运维后台端 |

两个端口在浏览器中属于**不同 Origin**（同 host 不同 port），localStorage 天然隔离，无法跨端口读取。但注意：
- `sessionStorage` / `localStorage` 的隔离仅在浏览器层面有效；
- 两套 SPA 均无后端 API，所有权限判断在 JS 层完成，端口分离是部署层面的隔离，而非安全边界。
- 生产部署时建议将运维端置于内网或 VPN 后，避免公网直接访问。

---

## 构建产物

```
dist/index.html                   0.46 kB │ gzip:   0.31 kB
dist/assets/index-CPwXHVo2.css   36.58 kB │ gzip:   7.55 kB
dist/assets/index-DZpY57ac.js   254.26 kB │ gzip:  78.04 kB
```

CSS 增量约 5 kB（ProfilePage.css），JS 增量约 8 kB（ProfilePage + FileListParts），增幅合理。

---

## 备注

- `npm run format:check` 仍会提示 `AUDIT_REPORT.md` 未格式化，该文件为审计记录非业务代码，不影响功能。
- 建议后续配置 `@vitest/coverage-v8` 以启用测试覆盖率报告。
