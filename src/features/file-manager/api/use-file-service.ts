import { useContext } from 'react'
import type { FileService } from './types'
import { FileServiceContext } from './file-service-context'

export function useFileService(): FileService {
  const service = useContext(FileServiceContext)
  if (!service) {
    throw new Error('useFileService 必须在 FileServiceProvider 内使用')
  }
  return service
}
