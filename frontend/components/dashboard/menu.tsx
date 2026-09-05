'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

type TriggerProps = {
  id: string
  'aria-haspopup': 'menu'
  'aria-expanded': boolean
  'aria-controls': string
  onClick: () => void
  onKeyDown: (event: React.KeyboardEvent) => void
}

type MenuRenderProps = {
  close: () => void
}

type MenuProps = {
  trigger: (props: TriggerProps) => ReactNode
  children: (props: MenuRenderProps) => ReactNode
  align?: 'start' | 'end'
  /** Accessible label for the popup menu. */
  label?: string
  className?: string
  menuClassName?: string
}

/**
 * Accessible dropdown menu implementing the WAI-ARIA menu button pattern:
 * roving focus with Arrow/Home/End keys, Escape and outside-click to dismiss,
 * and focus restoration to the trigger on close.
 */
export function Menu({
  trigger,
  children,
  align = 'start',
  label,
  className,
  menuClassName,
}: MenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerId = useId()
  const menuId = useId()

  const focusTrigger = () => {
    containerRef.current
      ?.querySelector<HTMLElement>('[aria-haspopup="menu"]')
      ?.focus()
  }

  const close = (returnFocus = true) => {
    setOpen(false)
    if (returnFocus) focusTrigger()
  }

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const first = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    )
    first?.focus()
  }, [open])

  function onTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
    }
  }

  function onMenuKeyDown(event: React.KeyboardEvent) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ) ?? [],
    )
    if (items.length === 0) return
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        items[(currentIndex + 1) % items.length]?.focus()
        break
      case 'ArrowUp':
        event.preventDefault()
        items[(currentIndex - 1 + items.length) % items.length]?.focus()
        break
      case 'Home':
        event.preventDefault()
        items[0]?.focus()
        break
      case 'End':
        event.preventDefault()
        items[items.length - 1]?.focus()
        break
      case 'Escape':
        event.preventDefault()
        close()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {trigger({
        id: triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': menuId,
        onClick: () => setOpen((prev) => !prev),
        onKeyDown: onTriggerKeyDown,
      })}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          aria-labelledby={label ? undefined : triggerId}
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute z-50 mt-2 min-w-56 origin-top overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none',
            'animate-in fade-in-0 zoom-in-95 duration-100',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName,
          )}
        >
          {children({ close })}
        </div>
      )}
    </div>
  )
}

type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  inset?: boolean
  destructive?: boolean
}

export function MenuItem({
  className,
  inset,
  destructive,
  children,
  ...props
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        destructive &&
          'text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive',
        inset && 'pl-9',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function MenuLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'px-2.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 -mx-0.5 h-px bg-border" />
}
