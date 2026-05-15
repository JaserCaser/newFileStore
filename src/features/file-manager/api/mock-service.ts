import type {
  CreateFolderParams,
  FileItem,
  FileListParams,
  FileListResponse,
  FileService,
  MoveParams,
  RenameParams,
  StorageInfo,
  UploadProgressCallback,
  UploadResult,
} from './types'
import { generateId, getFileType } from './utils'

/** 模拟延迟 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 初始模拟数据 */
function createInitialData(): FileItem[] {
  const now = new Date()
  const items: FileItem[] = [
    {
      id: 'f1',
      name: '工作文档',
      type: 'folder',
      size: 0,
      parentId: null,
      createdAt: '2024-01-15T10:00:00Z',
      modifiedAt: '2024-03-20T14:30:00Z',
    },
    {
      id: 'f2',
      name: '家庭相册',
      type: 'folder',
      size: 0,
      parentId: null,
      createdAt: '2024-02-10T08:00:00Z',
      modifiedAt: '2024-04-05T16:20:00Z',
    },
    {
      id: 'f3',
      name: '项目资料',
      type: 'folder',
      size: 0,
      parentId: null,
      createdAt: '2024-03-01T09:00:00Z',
      modifiedAt: '2024-04-10T11:00:00Z',
    },
    {
      id: 'd1',
      name: '年度报告.pdf',
      type: 'document',
      size: 2516582,
      parentId: null,
      createdAt: '2024-03-20T14:30:00Z',
      modifiedAt: '2024-03-20T14:30:00Z',
      mimeType: 'application/pdf',
    },
    {
      id: 'd2',
      name: '设计草图.png',
      type: 'image',
      size: 1258291,
      parentId: null,
      createdAt: '2024-04-01T10:00:00Z',
      modifiedAt: '2024-04-02T09:15:00Z',
      mimeType: 'image/png',
    },
    {
      id: 'd3',
      name: '会议记录.docx',
      type: 'document',
      size: 153600,
      parentId: null,
      createdAt: '2024-04-05T16:20:00Z',
      modifiedAt: '2024-04-05T16:20:00Z',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    {
      id: 'd4',
      name: '产品演示.mp4',
      type: 'video',
      size: 129922560,
      parentId: null,
      createdAt: '2024-04-08T11:00:00Z',
      modifiedAt: '2024-04-08T11:00:00Z',
      mimeType: 'video/mp4',
    },
    {
      id: 'd5',
      name: '团队合照.jpg',
      type: 'image',
      size: 3145728,
      parentId: null,
      createdAt: now.toISOString(),
      modifiedAt: now.toISOString(),
      mimeType: 'image/jpeg',
    },
    {
      id: 'd6',
      name: '备份数据.zip',
      type: 'archive',
      size: 52428800,
      parentId: null,
      createdAt: '2024-03-15T08:00:00Z',
      modifiedAt: '2024-03-15T08:00:00Z',
      mimeType: 'application/zip',
    },
    {
      id: 'd7',
      name: '背景音乐.mp3',
      type: 'audio',
      size: 4194304,
      parentId: null,
      createdAt: '2024-02-28T12:00:00Z',
      modifiedAt: '2024-02-28T12:00:00Z',
      mimeType: 'audio/mpeg',
    },
    // 工作文档子目录
    {
      id: 'f1d1',
      name: 'Q1 财报.xlsx',
      type: 'document',
      size: 524288,
      parentId: 'f1',
      createdAt: '2024-03-20T14:30:00Z',
      modifiedAt: '2024-03-20T14:30:00Z',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    {
      id: 'f1d2',
      name: '产品路线图.pptx',
      type: 'document',
      size: 2097152,
      parentId: 'f1',
      createdAt: '2024-03-25T10:00:00Z',
      modifiedAt: '2024-04-01T09:00:00Z',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },
  ]

  return items
}

/**
 * Mock 文件服务 —— 内存存储，刷新即丢失。
 * 替换为真实 API 时只需实现同一 FileService 接口。
 */
export class MockFileService implements FileService {
  private files: FileItem[]

  constructor() {
    this.files = createInitialData()
  }

  async listFiles(params: FileListParams): Promise<FileListResponse> {
    await delay(200)

    let items = this.files.filter((f) => f.parentId === (params.parentId ?? null))

    // 关键字搜索（递归搜索所有文件）
    if (params.keyword) {
      const kw = params.keyword.toLowerCase()
      items = this.files.filter((f) => f.name.toLowerCase().includes(kw))
    }

    // 类型筛选
    if (params.type) {
      items = items.filter((f) => f.type === params.type)
    }

    // 排序
    const sort = params.sort
    if (sort) {
      items = [...items].sort((a, b) => {
        let cmp = 0
        switch (sort.field) {
          case 'name':
            cmp = a.name.localeCompare(b.name, 'zh-CN')
            break
          case 'size':
            cmp = a.size - b.size
            break
          case 'modifiedAt':
            cmp = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime()
            break
          case 'createdAt':
            cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            break
          case 'type':
            cmp = a.type.localeCompare(b.type)
            break
        }
        return sort.direction === 'desc' ? -cmp : cmp
      })
    }

    // 分页
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 50
    const total = items.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)

    return {
      items: paged,
      pagination: { page, pageSize, total, totalPages },
    }
  }

  async createFolder(params: CreateFolderParams): Promise<FileItem> {
    await delay(150)

    const folder: FileItem = {
      id: generateId(),
      name: params.name,
      type: 'folder',
      size: 0,
      parentId: params.parentId ?? null,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    }

    this.files.push(folder)
    return folder
  }

  async rename(params: RenameParams): Promise<FileItem> {
    await delay(100)

    const idx = this.files.findIndex((f) => f.id === params.id)
    if (idx === -1) {
      throw new Error(`文件不存在: ${params.id}`)
    }

    const updated: FileItem = {
      ...this.files[idx],
      name: params.name,
      modifiedAt: new Date().toISOString(),
    }

    this.files[idx] = updated
    return updated
  }

  async delete(ids: readonly string[]): Promise<void> {
    await delay(200)

    const idSet = new Set(ids)
    // 递归收集要删除的子项
    const collectChildren = (parentId: string): string[] => {
      const children = this.files.filter((f) => f.parentId === parentId)
      const result: string[] = []
      for (const child of children) {
        result.push(child.id)
        if (child.type === 'folder') {
          result.push(...collectChildren(child.id))
        }
      }
      return result
    }

    const allIds = new Set(idSet)
    for (const id of idSet) {
      for (const childId of collectChildren(id)) {
        allIds.add(childId)
      }
    }

    this.files = this.files.filter((f) => !allIds.has(f.id))
  }

  async move(params: MoveParams): Promise<void> {
    await delay(150)

    const idSet = new Set(params.ids)
    this.files = this.files.map((f) => {
      if (idSet.has(f.id)) {
        return {
          ...f,
          parentId: params.targetParentId,
          modifiedAt: new Date().toISOString(),
        }
      }
      return f
    })
  }

  async upload(
    file: File,
    parentId: string | null,
    onProgress?: UploadProgressCallback,
  ): Promise<UploadResult> {
    // 模拟上传进度
    for (let p = 0; p <= 100; p += 10) {
      await delay(40)
      onProgress?.(p)
    }

    const newFile: FileItem = {
      id: generateId(),
      name: file.name,
      type: getFileType(file.name),
      size: file.size,
      parentId,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      ...(file.type ? { mimeType: file.type } : {}),
    }

    this.files.push(newFile)
    return { file: newFile }
  }

  async download(id: string): Promise<Blob> {
    await delay(300)
    const file = this.files.find((f) => f.id === id)
    if (!file) throw new Error('文件不存在')
    // Mock: return a small text blob
    return new Blob(['Mock file content for: ' + file.name], { type: 'text/plain' })
  }

  async copy(ids: readonly string[]): Promise<readonly FileItem[]> {
    await delay(200)
    const results: FileItem[] = []
    for (const id of ids) {
      const original = this.files.find((f) => f.id === id)
      if (!original) continue
      const copy: FileItem = {
        ...original,
        id: generateId(),
        name: original.name.replace(/(\.[^.]+)?$/, ' 副本$1'),
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      }
      this.files.push(copy)
      results.push(copy)
    }
    return results
  }

  async getStorageInfo(): Promise<StorageInfo> {
    await delay(100)
    const used = this.files.reduce((sum, f) => sum + f.size, 0)
    return { used, total: 107374182400 } // 100 GB
  }
}
