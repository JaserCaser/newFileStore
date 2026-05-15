import type {
  CreateFolderParams,
  FileItem,
  FileListParams,
  FileListResponse,
  FileService,
  MagnetPullParams,
  MagnetPullResult,
  MoveParams,
  RenameParams,
  StorageInfo,
  UploadProgressCallback,
  UploadResult,
} from './types'
import { generateId, getFileType } from './utils'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isOfficeDocument(file: FileItem): boolean {
  if (file.type !== 'document') return false

  const lowerName = file.name.toLowerCase()
  const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
  const officeMimeSignals = [
    'msword',
    'ms-excel',
    'ms-powerpoint',
    'officedocument.wordprocessingml',
    'officedocument.spreadsheetml',
    'officedocument.presentationml',
  ]

  return (
    officeExts.some((ext) => lowerName.endsWith(ext)) ||
    officeMimeSignals.some((signal) => file.mimeType?.includes(signal))
  )
}

function createInitialData(): FileItem[] {
  const now = new Date()
  return [
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
    {
      id: 'f1d3',
      name: '合同模板.doc',
      type: 'document',
      size: 284672,
      parentId: 'f1',
      createdAt: '2024-04-12T09:30:00Z',
      modifiedAt: '2024-04-13T10:10:00Z',
      mimeType: 'application/msword',
    },
    {
      id: 'f2d1',
      name: '海边假期.heic',
      type: 'image',
      size: 4194304,
      parentId: 'f2',
      createdAt: '2024-04-14T08:00:00Z',
      modifiedAt: '2024-04-14T08:00:00Z',
      mimeType: 'image/heic',
    },
    {
      id: 'f2d2',
      name: '生日晚餐.webp',
      type: 'image',
      size: 1782579,
      parentId: 'f2',
      createdAt: '2024-04-15T19:40:00Z',
      modifiedAt: '2024-04-15T19:40:00Z',
      mimeType: 'image/webp',
    },
    {
      id: 'f3d1',
      name: '需求清单.xls',
      type: 'document',
      size: 393216,
      parentId: 'f3',
      createdAt: '2024-04-16T13:25:00Z',
      modifiedAt: '2024-04-16T13:25:00Z',
      mimeType: 'application/vnd.ms-excel',
    },
  ]
}

function collectDescendants(files: readonly FileItem[], ids: readonly string[]): Set<string> {
  const targetIds = new Set(ids)
  const queue = [...ids]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue
    for (const file of files) {
      if (file.parentId === current && !targetIds.has(file.id)) {
        targetIds.add(file.id)
        if (file.type === 'folder') queue.push(file.id)
      }
    }
  }

  return targetIds
}

function isDefaultRecentSort(sort: FileListParams['sort']): boolean {
  return !sort || (sort.field === 'modifiedAt' && sort.direction === 'desc')
}

function extractMagnetName(magnetLink: string): string {
  const displayName = /(?:[?&])dn=([^&]+)/i.exec(magnetLink)?.[1]
  if (displayName) {
    return decodeURIComponent(displayName.replace(/\+/g, ' ')).trim()
  }

  const hash = /(?:[?&])xt=urn:btih:([^&]+)/i.exec(magnetLink)?.[1]
  if (hash) {
    return `磁力拉取 ${hash.slice(0, 8).toUpperCase()}`
  }

  return '磁力拉取文件'
}

function getSimulatedMagnetSize(magnetLink: string): number {
  let hash = 0
  for (let i = 0; i < magnetLink.length; i += 1) {
    hash = (hash * 31 + magnetLink.charCodeAt(i)) >>> 0
  }

  const min = 120 * 1024 * 1024
  const range = 1800 * 1024 * 1024
  return min + (hash % range)
}

export class MockFileService implements FileService {
  private files: FileItem[]

  constructor() {
    this.files = createInitialData()
  }

  async listFiles(params: FileListParams): Promise<FileListResponse> {
    await delay(200)

    let items: FileItem[]

    if (params.view === 'recent') {
      const allNonFolders = [...this.files]
        .filter((f) => f.type !== 'folder')
        .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
      const useRecentPreview = !params.keyword && isDefaultRecentSort(params.sort)

      items = useRecentPreview ? allNonFolders.slice(0, params.pageSize ?? 24) : allNonFolders
    } else if (params.view === 'photos') {
      items = this.files.filter((f) => f.type === 'image')
    } else if (params.view === 'office') {
      items = this.files.filter((f) => isOfficeDocument(f))
    } else {
      items = this.files.filter((f) => f.parentId === (params.parentId ?? null))
    }

    if (params.keyword) {
      const kw = params.keyword.toLowerCase()
      const source = params.view && params.view !== 'all' ? items : this.files
      items = source.filter((f) => f.name.toLowerCase().includes(kw))
    }

    if (params.type) {
      items = items.filter((f) => f.type === params.type)
    }

    if (params.sort) {
      const { field, direction } = params.sort
      items = [...items].sort((a, b) => {
        let cmp = 0
        switch (field) {
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
            cmp = a.type.localeCompare(b.type, 'zh-CN')
            break
        }
        return direction === 'asc' ? cmp : -cmp
      })
    }

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

    const now = new Date().toISOString()
    const folder: FileItem = {
      id: generateId(),
      name: params.name,
      type: 'folder',
      size: 0,
      parentId: params.parentId ?? null,
      createdAt: now,
      modifiedAt: now,
    }
    this.files = [...this.files, folder]
    return folder
  }

  async rename(params: RenameParams): Promise<FileItem> {
    await delay(100)

    const next = this.files.find((file) => file.id === params.id)
    if (!next) throw new Error('File not found')

    const updated: FileItem = { ...next, name: params.name, modifiedAt: new Date().toISOString() }
    this.files = this.files.map((file) => (file.id === params.id ? updated : file))
    return updated
  }

  async delete(ids: readonly string[]): Promise<void> {
    await delay(200)

    const toDelete = collectDescendants(this.files, ids)
    this.files = this.files.filter((file) => !toDelete.has(file.id))
  }

  async move(params: MoveParams): Promise<void> {
    await delay(150)

    const now = new Date().toISOString()
    const targetIds = new Set(params.ids)
    this.files = this.files.map((file) =>
      targetIds.has(file.id) ? { ...file, parentId: params.targetParentId, modifiedAt: now } : file,
    )
  }

  async upload(
    file: File,
    parentId: string | null,
    onProgress?: UploadProgressCallback,
  ): Promise<UploadResult> {
    onProgress?.(0)
    await delay(50)
    onProgress?.(50)

    const now = new Date().toISOString()
    const item: FileItem = {
      id: generateId(),
      name: file.name,
      type: getFileType(file.name),
      size: file.size,
      parentId,
      createdAt: now,
      modifiedAt: now,
      ...(file.type ? { mimeType: file.type } : {}),
    }

    this.files = [...this.files, item]
    onProgress?.(100)
    return { file: item }
  }

  async pullMagnet(params: MagnetPullParams): Promise<MagnetPullResult> {
    await delay(700)

    const normalizedLink = params.magnetLink.trim()
    if (!/^magnet:\?xt=urn:btih:[a-z0-9]{32,40}(?:&.*)?$/i.test(normalizedLink)) {
      throw new Error('请输入有效的磁力链接')
    }

    const now = new Date().toISOString()
    const explicitName = params.name?.trim()
    const name = (explicitName && explicitName.length > 0 ? explicitName : extractMagnetName(normalizedLink)).slice(
      0,
      120,
    )
    const fileType = getFileType(name)
    const file: FileItem = {
      id: generateId(),
      name,
      type: fileType === 'other' ? 'video' : fileType,
      size: getSimulatedMagnetSize(normalizedLink),
      parentId: params.parentId,
      createdAt: now,
      modifiedAt: now,
      mimeType: 'application/x-bittorrent',
    }

    this.files = [...this.files, file]
    return { file }
  }

  async download(id: string): Promise<Blob> {
    await delay(300)

    const file = this.files.find((item) => item.id === id)
    if (!file) throw new Error('File not found')
    return new Blob([file.name], { type: file.mimeType ?? 'application/octet-stream' })
  }

  async copy(ids: readonly string[]): Promise<readonly FileItem[]> {
    await delay(200)

    const copied: FileItem[] = []
    const now = new Date().toISOString()

    for (const id of ids) {
      const file = this.files.find((item) => item.id === id)
      if (!file) continue

      const clone: FileItem = {
        ...file,
        id: generateId(),
        name: `${file.name} copy`,
        createdAt: now,
        modifiedAt: now,
      }
      copied.push(clone)
    }

    this.files = [...this.files, ...copied]
    return copied
  }

  async getStorageInfo(): Promise<StorageInfo> {
    await delay(100)

    const used = this.files.reduce((sum, file) => sum + file.size, 0)
    return {
      used,
      total: 10 * 1024 * 1024 * 1024,
    }
  }
}
