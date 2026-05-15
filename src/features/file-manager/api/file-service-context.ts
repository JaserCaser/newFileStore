import { createContext } from 'react'
import type { FileService } from './types'

export const FileServiceContext = createContext<FileService | null>(null)
