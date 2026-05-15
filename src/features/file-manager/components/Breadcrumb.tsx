import { ChevronRight, Folder } from 'lucide-react'
import type { BreadcrumbNode } from '../api'
import './Breadcrumb.css'

type BreadcrumbProps = {
  readonly items: readonly BreadcrumbNode[]
  readonly onNavigate: (id: string | null) => void
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="fm-breadcrumb" aria-label="文件路径">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const targetId = item.id === 'root' ? null : item.id

        return (
          <span key={item.id} className="fm-breadcrumb-item">
            {i > 0 && <ChevronRight size={14} className="fm-breadcrumb-sep" aria-hidden="true" />}
            {isLast ? (
              <span className="fm-breadcrumb-current" aria-current="page">
                {i === 0 && <Folder size={14} aria-hidden="true" />}
                {item.name}
              </span>
            ) : (
              <button
                className="fm-breadcrumb-link"
                type="button"
                onClick={() => onNavigate(targetId)}
              >
                {i === 0 && <Folder size={14} aria-hidden="true" />}
                {item.name}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
