'use client'

import { useState } from 'react'
import { Menu as MenuIcon, Boxes, ShoppingCart, Zap, Activity, BookOpen, ExternalLink } from 'lucide-react'
import { Breadcrumbs } from './breadcrumbs'
import { Notifications } from './notifications'
import { SearchBar } from './search-bar'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'
import { TenantSwitcher } from './tenant-switcher'
import { ConcurrencySimulatorModal } from './concurrency-simulator-modal'
import { SystemHealthDrawer } from './system-health-drawer'
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
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [healthDrawerOpen, setHealthDrawerOpen] = useState(false)

  return (
    <>
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

        {/* Tenant Switcher in Top Bar - only show when desktop sidebar is hidden */}
        {tenant && onTenantChange && (
          <div className="hidden sm:block lg:hidden w-48 shrink-0">
            <TenantSwitcher active={tenant} onChange={onTenantChange} />
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="hidden min-w-0 sm:block shrink-0">
          <Breadcrumbs trail={breadcrumb} />
        </div>

        {/* Search Bar with Ctrl+K Visual Cue */}
        <div className="flex-1 min-w-[180px] max-w-sm ml-auto">
          <SearchBar />
        </div>

        {/* Controls: Concurrency tester, Theme toggle, Notifications, User profile menu */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Interactive Concurrency Stress-Tester Trigger */}
          <button
            type="button"
            onClick={() => setSimulatorOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all shadow-xs"
            aria-label="Launch interactive concurrency stress test simulator"
          >
            <Zap className="size-3.5 fill-current text-amber-500" aria-hidden="true" />
            <span className="hidden xl:inline">Stress-Test Concurrency</span>
            <span className="xl:hidden">Stress-Test</span>
          </button>

          {/* Live System Health & Telemetry Trigger */}
          <button
            type="button"
            onClick={() => setHealthDrawerOpen(true)}
            className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-xs"
            aria-label="Inspect live database connection pool and latency telemetry"
          >
            <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <Activity className="size-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">Health 99.99%</span>
            <span className="xl:hidden">99.99%</span>
          </button>

          {/* Interactive OpenAPI 3.0 Documentation Console Trigger */}
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden 2xl:inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all shadow-xs"
            aria-label="Open interactive OpenAPI 3.0 Swagger and Scalar documentation in new tab"
          >
            <BookOpen className="size-3.5" aria-hidden="true" />
            <span>API Docs</span>
            <ExternalLink className="size-2.5 opacity-60" aria-hidden="true" />
          </a>

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

    <ConcurrencySimulatorModal
      open={simulatorOpen}
      onClose={() => setSimulatorOpen(false)}
    />

    <SystemHealthDrawer
      open={healthDrawerOpen}
      onClose={() => setHealthDrawerOpen(false)}
    />
  </>
  )
}
