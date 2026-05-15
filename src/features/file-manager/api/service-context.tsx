import { useMemo, type ReactNode } from 'react'
import type { FileService } from './types'
import { MockFileService } from './mock-service'
import { FileServiceContext } from './file-service-context'

/**
 * 文件服务 Provider —— 在此切换底层实现。
 * 将 MockFileService 替换为真实的 HTTP 客户端即可完成对接。
 */
export function FileServiceProvider({ children }: { readonly children: ReactNode }) {
  const service = useMemo<FileService>(() => new MockFileService(), [])

  return <FileServiceContext.Provider value={service}>{children}</FileServiceContext.Provider>
}
