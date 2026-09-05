import { navItems, type Tenant } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { InventoryView } from './inventory-view'
import { OrderDeskView } from './order-desk-view'
import { Boxes, ShoppingCart, BarChart3, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'

interface ContentAreaProps {
  activeKey: string
  onNavigate?: (key: string) => void
  tenant?: Tenant
}

export function ContentArea({ activeKey, onNavigate, tenant }: ContentAreaProps) {
  // View 1: Inventory Data Table & Management View
  if (activeKey === 'inventory') {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
        <InventoryView tenant={tenant} />
      </div>
    )
  }

  // View 2: Order Desk & Checkout POS View
  if (activeKey === 'orders') {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
        <OrderDeskView tenant={tenant} />
      </div>
    )
  }

  // Dashboard Executive Overview with instant switchers to View 1 & View 2
  if (activeKey === 'dashboard') {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
        {/* Wood-Surface Hero Overview */}
        <section className="wood-surface relative overflow-hidden rounded-2xl border border-border/70 p-6 shadow-xl">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              <TrendingUp className="size-3.5" />
              StockPulse Operations Hub · {tenant?.name ?? 'Bharat Logistics & Retail'}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Enterprise Logistics &amp; POS Station
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-pretty text-[oklch(0.85_0.02_78)]">
              Welcome to the centralized multi-tenant console. Seamlessly jump between high-density warehouse stock ledger management and high-throughput point-of-sale order checkout.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => onNavigate?.('inventory')}
                className="gap-2 font-bold shadow-lg"
              >
                <Boxes className="size-4" />
                <span>Open Stock Catalog (View 1)</span>
                <ArrowRight className="size-3.5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate?.('orders')}
                className="gap-2 font-bold border-white/20 hover:bg-white/10 text-white shadow-lg"
              >
                <ShoppingCart className="size-4" />
                <span>Launch Order Desk POS (View 2)</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Primary View Feature Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card for View 1 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/50 transition-all">
            <div className="flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Boxes className="size-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                View 1: Inventory Data Table &amp; Management
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                High-density, accessible tabular ledger featuring 40x40 thumbnails, SKU sorting, dynamic low-stock progress bars, WCAG AA status badges, CSV export, and modal adjustments.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onNavigate?.('inventory')}
                className="w-full justify-between text-xs font-semibold"
              >
                <span>Launch Inventory Management</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Card for View 2 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/50 transition-all">
            <div className="flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <ShoppingCart className="size-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                View 2: Order Desk &amp; Checkout POS
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                High-speed split-screen order terminal featuring multi-column product catalog, barcode scan simulation, live customer selector, automated 8.875% tax, order holds, and receipt dialogs.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onNavigate?.('orders')}
                className="w-full justify-between text-xs font-semibold"
              >
                <span>Launch POS Terminal</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Embedded Live Inventory View for instantaneous access */}
        <div className="pt-2">
          <InventoryView tenant={tenant} />
        </div>
      </div>
    )
  }

  // Fallback for other tabs (analytics, settings)
  const active = navItems.find((item) => item.key === activeKey) ?? navItems[0]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {active.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          Tenant: {tenant?.name ?? 'Bharat Logistics & Retail'} · Region: {tenant?.region ?? 'AP-South-1 (Mumbai)'}
        </p>
      </div>

      <div className="flex min-h-80 flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <div className="flex max-w-sm flex-col items-center gap-3">
          <active.icon className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">
            {active.title} Settings &amp; Reporting
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Multi-tenant partition active for {tenant?.name ?? 'Bharat Logistics & Retail'}.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={() => onNavigate?.('inventory')}>
              Switch to Inventory
            </Button>
            <Button size="sm" variant="outline" onClick={() => onNavigate?.('orders')}>
              Switch to POS
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
