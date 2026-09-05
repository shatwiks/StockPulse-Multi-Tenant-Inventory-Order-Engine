'use client'

import { X } from 'lucide-react'
import { useId, useRef, type ReactNode } from 'react'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { cn } from '@/lib/utils'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
  /** Hide the default header (used by fullscreen receipt state). */
  hideHeader?: boolean
  className?: string
}

/**
 * Accessible modal dialog: renders role="dialog" aria-modal, traps focus,
 * closes on Escape / scrim click, and restores focus to the opener.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideHeader = false,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  useFocusTrap(open, panelRef, onClose)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-background/75 backdrop-blur-sm animate-in fade-in-0 duration-150"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card text-card-foreground shadow-2xl outline-none sm:rounded-2xl',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200 sm:slide-in-from-bottom-0',
          size === 'lg' ? 'max-w-2xl' : 'max-w-md',
          className,
        )}
      >
        {!hideHeader && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 id={titleId} className="text-base font-semibold text-balance">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-sm text-muted-foreground text-pretty">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4.5" aria-hidden="true" />
            </button>
          </div>
        )}
        {hideHeader && (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
