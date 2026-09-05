'use client'

import { ChevronDown, CircleUser, LogOut, Settings, User } from 'lucide-react'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './menu'

const currentUser = {
  name: 'Dana Whitfield',
  email: 'dana.w@acme-dist.com',
  role: 'Store Admin',
  initials: 'DW',
}

export function UserMenu() {
  return (
    <Menu
      align="end"
      label="Account menu"
      menuClassName="w-60"
      trigger={(triggerProps) => (
        <button
          type="button"
          {...triggerProps}
          className="flex items-center gap-2 rounded-lg border border-transparent p-1 pr-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            {currentUser.initials}
          </span>
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-sm font-medium text-foreground">
              {currentUser.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {currentUser.role}
            </span>
          </span>
          <ChevronDown
            className="hidden size-4 text-muted-foreground sm:block"
            aria-hidden="true"
          />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="flex items-center gap-3 px-2.5 py-2">
            <span
              className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              aria-hidden="true"
            >
              {currentUser.initials}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {currentUser.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {currentUser.email}
              </span>
            </span>
          </div>
          <div className="px-2.5 pb-1.5">
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {currentUser.role}
            </span>
          </div>
          <MenuSeparator />
          <MenuLabel>Account</MenuLabel>
          <MenuItem onClick={close}>
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
            Profile
          </MenuItem>
          <MenuItem onClick={close}>
            <CircleUser
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Preferences
          </MenuItem>
          <MenuItem onClick={close}>
            <Settings
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Organization settings
          </MenuItem>
          <MenuSeparator />
          <MenuItem destructive onClick={close}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </MenuItem>
        </>
      )}
    </Menu>
  )
}
