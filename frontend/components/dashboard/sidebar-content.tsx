'use client'

import Link from 'next/link'
import { PanelLeftClose, PanelLeft, Headset, Shield, FileText } from 'lucide-react'
import { navItems } from '@/lib/nav'
import type { Tenant } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { TenantSwitcher } from './tenant-switcher'

import { StockPulseVectorLogo } from '@/components/auth/stockpulse-vector-logo'

type SidebarContentProps = {
  activeKey: string
  onNavigate: (key: string) => void
  tenant: Tenant
  onTenantChange: (tenant: Tenant) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  /** True when rendered inside the mobile drawer. */
  mobile?: boolean
  onOpenSupport?: () => void
}

export function SidebarContent({
  activeKey,
  onNavigate,
  tenant,
  onTenantChange,
  collapsed = false,
  onToggleCollapse,
  mobile = false,
  onOpenSupport,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col gap-3.5 p-3">
      {/* Brand Header */}
      <div className={cn('flex items-center gap-2.5 px-1 py-1', collapsed && 'justify-center px-0')}>
        <StockPulseVectorLogo size={collapsed ? 28 : 32} animated showGlow />
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <div className="font-display font-bold text-base tracking-tight">
              <span className="text-[#F3E8E2]">Stock</span>
              <span className="text-[#F59E0B] font-extrabold ml-0.5">Pulse</span>
            </div>
            <span className="text-[11px] font-mono text-amber-200/80 uppercase tracking-wider mt-0.5">Inventory Engine</span>
          </div>
        )}
      </div>

      <div className={cn('flex flex-col gap-3', collapsed && 'items-center')}>
        <TenantSwitcher
          active={tenant}
          onChange={onTenantChange}
          collapsed={collapsed}
        />
      </div>

      <nav
        aria-label="Primary"
        className="flex-1"
      >
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = item.key === activeKey
            const Icon = item.icon
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.title : undefined}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors',
                    'focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <Icon
                    className={cn('size-4.5 shrink-0', !isActive && 'opacity-80')}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="flex-1 text-left">{item.title}</span>}
                  {!collapsed && item.badge ? (
                    <span
                      className={cn(
                        'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
                        isActive
                          ? 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground'
                          : 'bg-accent text-accent-foreground',
                      )}
                    >
                      {item.badge}
                      <span className="sr-only"> pending items</span>
                    </span>
                  ) : null}
                  {collapsed && item.badge ? (
                    <span
                      className="absolute top-1 right-1 size-2 rounded-full bg-primary"
                      aria-label={`${item.badge} pending items`}
                    />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Support & Hub Contact */}
      {onOpenSupport && (
        <button
          type="button"
          onClick={onOpenSupport}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Logistics Support Hub' : undefined}
          aria-label="Open 24/7 Logistics Support Hub"
        >
          <Headset className="size-4 shrink-0 text-amber-500" aria-hidden="true" />
          {!collapsed && <span>Support Hub &amp; HQ</span>}
        </button>
      )}

      {/* Legal Links (Collapsed: hidden, Expanded: tiny footer links) */}
      {!collapsed && (
        <div className="flex items-center justify-between px-2 text-[10px] text-stone-300">
          <Link href="/privacy" className="hover:text-amber-400 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-amber-400 transition-colors">
            Terms of SLA
          </Link>
        </div>
      )}

      {!mobile && onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeft className="size-4.5 shrink-0" aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose className="size-4.5 shrink-0" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
