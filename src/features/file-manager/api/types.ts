/** 文件/文件夹类型标识 */
export type FileType = 'folder' | 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other'

/** 文件项 */
export type FileItem = {
  readonly id: string
  readonly name: string
  readonly type: FileType
  readonly size: number
  readonly parentId: string | null
  readonly createdAt: string
  readonly modifiedAt: string
  readonly mimeType?: string
}

/** 文件夹面包屑节点 */
export type BreadcrumbNode = {
  readonly id: string
  readonly name: string
}

/** 排序字段 */
export type SortField = 'name' | 'size' | 'modifiedAt' | 'createdAt' | 'type'

/** 排序方向 */
export type SortDirection = 'asc' | 'desc'

/** 排序配置 */
export type SortConfig = {
  readonly field: SortField
  readonly direction: SortDirection
}

/** 文件列表查询参数 */
export type FileListParams = {
  readonly parentId?: string | null
  readonly keyword?: string
  readonly type?: FileType
  readonly sort?: SortConfig
  readonly page?: number
  readonly pageSize?: number
}

/** 分页信息 */
export type Pagination = {
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly totalPages: number
}

/** 文件列表响应 */
export type FileListResponse = {
  readonly items: readonly FileItem[]
  readonly pagination: Pagination
}

/** 创建文件夹参数 */
export type CreateFolderParams = {
  readonly name: string
  readonly parentId?: string | null
}

/** 重命名参数 */
export type RenameParams = {
  readonly id: string
  readonly name: string
}

/** 移动参数 */
export type MoveParams = {
  readonly ids: readonly string[]
  readonly targetParentId: string | null
}

/** 复制参数 */
export type CopyParams = {
  readonly ids: readonly string[]
}

/** 上传进度回调 */
export type UploadProgressCallback = (progress: number) => void

/** 上传结果 */
export type UploadResult = {
  readonly file: FileItem
}

/** 存储用量信息 */
export type StorageInfo = {
  readonly used: number
  readonly total: number
}

/** API 响应包装 */
export type ApiResponse<T> = {
  readonly success: boolean
  readonly data: T
  readonly message?: string
}

/**
 * 文件服务接口 —— 所有文件操作的契约。
 * 实现此接口即可替换底层存储（Mock / REST / IndexedDB / …）。
 */
export type FileService = {
  /** 获取文件列表 */
  listFiles(params: FileListParams): Promise<FileListResponse>

  /** 创建文件夹 */
  createFolder(params: CreateFolderParams): Promise<FileItem>

  /** 重命名文件或文件夹 */
  rename(params: RenameParams): Promise<FileItem>

  /** 删除文件或文件夹（支持批量） */
  delete(ids: readonly string[]): Promise<void>

  /** 移动文件或文件夹 */
  move(params: MoveParams): Promise<void>

  /** 上传文件 */
  upload(
    file: File,
    parentId: string | null,
    onProgress?: UploadProgressCallback,
  ): Promise<UploadResult>

  /** 下载文件（返回 Blob） */
  download(id: string): Promise<Blob>

  /** 复制文件或文件夹 */
  copy(ids: readonly string[]): Promise<readonly FileItem[]>

  /** 获取存储用量 */
  getStorageInfo(): Promise<StorageInfo>
}
