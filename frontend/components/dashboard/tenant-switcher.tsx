'use client'

import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './menu'
import { tenants, type Tenant } from '@/lib/nav'
import { cn } from '@/lib/utils'

type TenantSwitcherProps = {
  active: Tenant
  onChange: (tenant: Tenant) => void
  collapsed?: boolean
}

export function TenantSwitcher({
  active,
  onChange,
  collapsed,
}: TenantSwitcherProps) {
  return (
    <Menu
      label="Switch organization"
      className="w-full"
      menuClassName="w-64"
      trigger={(triggerProps) => (
        <button
          type="button"
          {...triggerProps}
          title={collapsed ? active.name : undefined}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar px-2 py-2 text-left outline-none transition-colors',
            'hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring',
            collapsed && 'justify-center px-0',
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-xs">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-sidebar-foreground">
                  {active.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {active.plan} · {active.region}
                </span>
              </span>
              <ChevronsUpDown
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <>
          <MenuLabel>Organizations</MenuLabel>
          {tenants.map((tenant) => (
            <MenuItem
              key={tenant.id}
              onClick={() => {
                onChange(tenant)
                close()
              }}
              aria-current={tenant.id === active.id ? 'true' : undefined}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Building2 className="size-3.5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{tenant.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {tenant.plan} · {tenant.region}
                </span>
              </span>
              {tenant.id === active.id && (
                <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
              )}
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem onClick={close}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
              <Plus className="size-3.5" aria-hidden="true" />
            </span>
            <span className="font-medium">Add organization</span>
          </MenuItem>
        </>
      )}
    </Menu>
  )
}
