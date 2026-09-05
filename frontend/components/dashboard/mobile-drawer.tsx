'use client'

import { X } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { cn } from '@/lib/utils'

type MobileDrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function MobileDrawer({
  open,
  onClose,
  title,
  children,
}: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, panelRef, onClose)

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 lg:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-xl outline-none transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
          <span className="text-sm font-semibold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <X className="size-4.5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
