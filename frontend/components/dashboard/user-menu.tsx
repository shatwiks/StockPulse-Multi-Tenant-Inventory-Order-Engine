'use client'

import { ChevronDown, CircleUser, LogOut, ShieldCheck, ShieldAlert, UserCheck, KeyRound } from 'lucide-react'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './menu'
import { useAuth, type UserRole } from '@/lib/auth-context'

export function UserMenu() {
  const { user, role, switchRole, logout, login } = useAuth()

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'Authenticated Operator'

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.email?.[0] || 'A').toUpperCase()

  const roleColors = {
    ADMIN: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    MANAGER: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    CASHIER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  }

  return (
    <Menu
      align="end"
      label="Account menu"
      menuClassName="w-64"
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
            {initials}
          </span>
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-xs font-semibold text-foreground">
              {displayName}
            </span>
            <span className="truncate text-[10px] text-muted-foreground font-mono">
              Role: {role}
            </span>
          </span>
          <ChevronDown
            className="hidden size-3.5 text-muted-foreground sm:block"
            aria-hidden="true"
          />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <span
              className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shrink-0"
              aria-hidden="true"
            >
              {initials}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-bold text-foreground">
                {displayName}
              </span>
              <span className="truncate text-[11px] text-muted-foreground font-mono">
                {user?.email || 'admin@acme-retail.com'}
              </span>
            </div>
          </div>

          <div className="px-3 pb-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                roleColors[role] || roleColors.CASHIER
              }`}
            >
              <ShieldCheck className="size-3" />
              <span>{role} (Least Privilege)</span>
            </span>
          </div>

          <MenuSeparator />
          <MenuLabel>Switch Test Role (Live RBAC)</MenuLabel>

          <MenuItem
            onClick={() => {
              switchRole('ADMIN')
              close()
            }}
          >
            <ShieldCheck className="size-3.5 text-rose-400" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">ADMIN (Alice Morgan)</span>
              <span className="text-[10px] text-muted-foreground">Full CRUD &amp; Settings</span>
            </div>
          </MenuItem>

          <MenuItem
            onClick={() => {
              switchRole('MANAGER')
              close()
            }}
          >
            <UserCheck className="size-3.5 text-amber-400" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">MANAGER (Bob Miller)</span>
              <span className="text-[10px] text-muted-foreground">Inventory CRUD &amp; Stock Adj.</span>
            </div>
          </MenuItem>

          <MenuItem
            onClick={() => {
              switchRole('CASHIER')
              close()
            }}
          >
            <KeyRound className="size-3.5 text-emerald-400" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">CASHIER (Charlie Davis)</span>
              <span className="text-[10px] text-muted-foreground">Catalog &amp; POS Checkout only</span>
            </div>
          </MenuItem>

          <MenuSeparator />
          <MenuItem
            destructive
            onClick={() => {
              logout()
              close()
            }}
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>Sign out / Reset</span>
          </MenuItem>
        </>
      )}
    </Menu>
  )
}
