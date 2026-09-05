'use client'

import { Bell } from 'lucide-react'
import { useState } from 'react'
import { notifications as initialNotifications } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Menu, MenuItem } from './menu'

export function Notifications() {
  const [items, setItems] = useState(initialNotifications)
  const unreadCount = items.filter((item) => item.unread).length

  return (
    <Menu
      align="end"
      label="Notifications"
      menuClassName="w-80"
      trigger={(triggerProps) => (
        <button
          type="button"
          {...triggerProps}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="size-4.5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white tabular-nums ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    >
      {() => (
        <>
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  setItems((prev) =>
                    prev.map((item) => ({ ...item, unread: false })),
                  )
                }
                className="rounded text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="my-1 -mx-0.5 h-px bg-border" role="separator" />
          <ul className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <MenuItem
                  onClick={() =>
                    setItems((prev) =>
                      prev.map((n) =>
                        n.id === item.id ? { ...n, unread: false } : n,
                      ),
                    )
                  }
                  className="items-start"
                >
                  <span
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      item.unread ? 'bg-primary' : 'bg-transparent',
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.time}
                      </span>
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  {item.unread && <span className="sr-only">Unread</span>}
                </MenuItem>
              </li>
            ))}
          </ul>
        </>
      )}
    </Menu>
  )
}
