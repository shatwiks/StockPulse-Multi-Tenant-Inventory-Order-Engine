'use client'

import { useCallback, useState } from 'react'
import { navItems, tenants, type Tenant } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { ContentArea } from './content-area'
import { MobileDrawer } from './mobile-drawer'
import { SidebarContent } from './sidebar-content'
import { TopBar } from './top-bar'

export function DashboardShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [activeKey, setActiveKey] = useState('inventory')
  const [tenant, setTenant] = useState<Tenant>(tenants[0])

  const activeTitle =
    navItems.find((item) => item.key === activeKey)?.title ?? 'Dashboard'
  const breadcrumb = [tenant.name, activeTitle]

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const handleNavigate = (key: string) => {
    setActiveKey(key)
    setMobileOpen(false)
  }

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus-visible:ring-2 focus-visible:ring-ring"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside
        aria-label="Sidebar"
        className={cn(
          'sticky top-0 hidden h-svh shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <SidebarContent
          activeKey={activeKey}
          onNavigate={handleNavigate}
          tenant={tenant}
          onTenantChange={setTenant}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />
      </aside>

      {/* Mobile drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={closeMobile}
        title="Navigation"
      >
        <SidebarContent
          activeKey={activeKey}
          onNavigate={handleNavigate}
          tenant={tenant}
          onTenantChange={setTenant}
          mobile
        />
      </MobileDrawer>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          breadcrumb={breadcrumb}
          onOpenMobileNav={() => setMobileOpen(true)}
          tenant={tenant}
          onTenantChange={setTenant}
          activeKey={activeKey}
          onNavigate={handleNavigate}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <ContentArea
            activeKey={activeKey}
            onNavigate={handleNavigate}
            tenant={tenant}
          />
        </main>
      </div>
    </div>
  )
}
