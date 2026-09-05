'use client'

import { Menu as MenuIcon, Boxes, ShoppingCart } from 'lucide-react'
import { Breadcrumbs } from './breadcrumbs'
import { Notifications } from './notifications'
import { SearchBar } from './search-bar'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'
import { TenantSwitcher } from './tenant-switcher'
import { type Tenant } from '@/lib/nav'
import { cn } from '@/lib/utils'

type TopBarProps = {
  breadcrumb: string[]
  onOpenMobileNav: () => void
  tenant?: Tenant
  onTenantChange?: (tenant: Tenant) => void
  activeKey?: string
  onNavigate?: (key: string) => void
}

export function TopBar({
  breadcrumb,
  onOpenMobileNav,
  tenant,
  onTenantChange,
  activeKey,
  onNavigate,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex flex-col gap-2.5 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile sidebar trigger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <MenuIcon className="size-4.5" aria-hidden="true" />
        </button>

        {/* Tenant Switcher in Top Bar */}
        {tenant && onTenantChange && (
          <div className="hidden sm:block w-48 md:w-56 shrink-0">
            <TenantSwitcher active={tenant} onChange={onTenantChange} />
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="hidden min-w-0 md:block">
          <Breadcrumbs trail={breadcrumb} />
        </div>

        {/* View Switcher Toggle (Inventory vs Order Desk POS) */}
        {activeKey && onNavigate && (
          <nav
            aria-label="Primary View Switcher"
            className="hidden xl:flex items-center gap-1 p-1 rounded-xl border border-border bg-card/70 shrink-0"
          >
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeKey === 'inventory'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Boxes className="size-3.5" aria-hidden="true" />
              <span>Inventory Table</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeKey === 'orders'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <ShoppingCart className="size-3.5" aria-hidden="true" />
              <span>Order Desk POS</span>
            </button>
          </nav>
        )}

        {/* Search Bar with Ctrl+K Visual Cue */}
        <div className="flex min-w-0 flex-1 justify-start md:max-w-md md:flex-none md:justify-end lg:flex-1">
          <SearchBar />
        </div>

        {/* Controls: Theme toggle, Notifications, User profile menu */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Notifications />
          <div className="mx-0.5 hidden h-6 w-px bg-border sm:block" />
          <UserMenu />
        </div>
      </div>

      {/* Mobile Breadcrumbs & Quick View Toggle */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <Breadcrumbs trail={breadcrumb} />
        {activeKey && onNavigate && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-semibold',
                activeKey === 'inventory'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-semibold',
                activeKey === 'orders'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              POS
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
