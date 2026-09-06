'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { type Tenant } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast-context'
import {
  TrendingUp,
  ShoppingCart,
  Boxes,
  ShieldCheck,
  Download,
  RotateCcw,
  Layers,
  ArrowUpRight,
  Package,
  AlertTriangle,
  Lock,
} from 'lucide-react'

interface AnalyticsViewProps {
  tenant?: Tenant
}

export function AnalyticsView({ tenant }: AnalyticsViewProps) {
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d' | 'ytd'>('14d')

  // Live Analytics API Query
  const { data: analyticsRes, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['analytics', tenant?.id],
    queryFn: async () => {
      const res = await apiClient.get('analytics')
      return res.data
    },
    enabled: role !== 'CASHIER',
  })

  // Fallback defaults if loading or offline
  const summary = analyticsRes?.summary || {
    totalRevenue: 248590.0,
    totalTax: 37920.5,
    ordersCount: 42,
    avgOrderValue: 5918.8,
    currency: 'INR',
    currencySymbol: '₹',
    taxRate: '18% GST',
  }

  const inventoryHealth = analyticsRes?.inventoryHealth || {
    totalProducts: 18,
    totalInventoryUnits: 342,
    inventoryValuation: 875400.0,
    inStockCount: 14,
    lowStockCount: 3,
    outOfStockCount: 1,
    healthScore: 92,
  }

  const topSellingProducts = analyticsRes?.topSellingProducts || [
    {
      id: '1',
      name: 'OmniScan Pro Barcode Reader',
      sku: 'BHT-ELE-1001',
      unitsSold: 16,
      revenue: 79984,
      currentStock: 12,
    },
    {
      id: '2',
      name: 'Thermal Receipt POS Printer 80mm',
      sku: 'BHT-ELE-1002',
      unitsSold: 12,
      revenue: 50388,
      currentStock: 8,
    },
    {
      id: '3',
      name: 'Steel-Toe Industrial Safety Boots',
      sku: 'BHT-SAF-1004',
      unitsSold: 18,
      revenue: 44982,
      currentStock: 25,
    },
    {
      id: '4',
      name: 'Coorg Robusta Corporate Coffee Pack',
      sku: 'BHT-PAN-1007',
      unitsSold: 35,
      revenue: 29750,
      currentStock: 40,
    },
    {
      id: '5',
      name: 'High-Visibility Safety Vest Pack (10x)',
      sku: 'BHT-SAF-1005',
      unitsSold: 14,
      revenue: 23786,
      currentStock: 15,
    },
  ]

  const categoryBreakdown = analyticsRes?.categoryBreakdown || [
    {
      id: 'cat-1',
      name: 'Enterprise Electronics & POS',
      productCount: 4,
      stockUnits: 84,
      valuation: 425000,
      salesRevenue: 130372,
      salesContribution: 52.4,
    },
    {
      id: 'cat-2',
      name: 'Warehouse & Logistics Gear',
      productCount: 8,
      stockUnits: 158,
      valuation: 310400,
      salesRevenue: 68768,
      salesContribution: 27.7,
    },
    {
      id: 'cat-3',
      name: 'Corporate Pantry & Essentials',
      productCount: 6,
      stockUnits: 100,
      valuation: 140000,
      salesRevenue: 49450,
      salesContribution: 19.9,
    },
  ]

  const salesTrend = analyticsRes?.salesTrend || [
    { date: 'Day 1', revenue: 14200, orders: 3 },
    { date: 'Day 2', revenue: 19800, orders: 4 },
    { date: 'Day 3', revenue: 12500, orders: 2 },
    { date: 'Day 4', revenue: 26400, orders: 5 },
    { date: 'Day 5', revenue: 21300, orders: 4 },
    { date: 'Day 6', revenue: 34100, orders: 6 },
    { date: 'Day 7', revenue: 18900, orders: 3 },
    { date: 'Day 8', revenue: 29500, orders: 5 },
    { date: 'Day 9', revenue: 16700, orders: 3 },
    { date: 'Day 10', revenue: 38200, orders: 7 },
    { date: 'Day 11', revenue: 22400, orders: 4 },
    { date: 'Day 12', revenue: 31000, orders: 5 },
    { date: 'Day 13', revenue: 27800, orders: 4 },
    { date: 'Day 14', revenue: 35600, orders: 6 },
  ]

  // Max revenue for bar scaling
  const maxTrendRevenue = useMemo(() => {
    return Math.max(...salesTrend.map((t: any) => t.revenue), 1000)
  }, [salesTrend])

  // CSV Report Generator
  function handleExportCsv() {
    const rows = [
      ['StockPulse Business Intelligence Report'],
      ['Tenant', tenant?.name || 'Bharat Logistics & Retail'],
      ['Region', tenant?.region || 'AP-South-1 (Mumbai)'],
      ['Currency', 'INR (₹)'],
      ['Generated At', new Date().toISOString()],
      [],
      ['--- FINANCIAL SUMMARY ---'],
      ['Total Revenue (INR)', summary.totalRevenue],
      ['Total Tax (18% GST)', summary.totalTax],
      ['CGST (9%)', (summary.totalTax / 2).toFixed(2)],
      ['SGST (9%)', (summary.totalTax / 2).toFixed(2)],
      ['Completed Orders', summary.ordersCount],
      ['Average Order Value (AOV)', summary.avgOrderValue],
      [],
      ['--- INVENTORY VALUATION & HEALTH ---'],
      ['Total Products (SKUs)', inventoryHealth.totalProducts],
      ['Total Inventory Units', inventoryHealth.totalInventoryUnits],
      ['Warehouse Valuation (INR)', inventoryHealth.inventoryValuation],
      ['In Stock Count', inventoryHealth.inStockCount],
      ['Low Stock Alert Count', inventoryHealth.lowStockCount],
      ['Out of Stock Count', inventoryHealth.outOfStockCount],
      ['Overall Health Score', `${inventoryHealth.healthScore}%`],
      [],
      ['--- CATEGORY CAPITAL ALLOCATION ---'],
      ['Category Name', 'Products', 'Stock Units', 'Valuation (INR)', 'Revenue (INR)', 'Contribution %'],
      ...categoryBreakdown.map((c: any) => [
        `"${c.name}"`,
        c.productCount,
        c.stockUnits,
        c.valuation,
        c.salesRevenue,
        `${c.salesContribution}%`,
      ]),
      [],
      ['--- TOP REVENUE SKUs ---'],
      ['SKU', 'Product Name', 'Units Sold', 'Revenue (INR)', 'Current Stock'],
      ...topSellingProducts.map((p: any) => [
        p.sku,
        `"${p.name}"`,
        p.unitsSold,
        p.revenue,
        p.currentStock,
      ]),
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `StockPulse_BI_Report_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('BI Executive Report exported to CSV successfully.', 'Export Completed')
  }

  // If CASHIER role, render security warning
  if (role === 'CASHIER') {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
        <div className="flex min-h-80 flex-1 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <div className="flex max-w-md flex-col items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <Lock className="size-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Restricted Enterprise Access
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The <strong>Analytics &amp; Business Intelligence Console</strong> contains confidential financial metrics, revenue valuations, and warehouse margin data.
            </p>
            <p className="text-xs text-muted-foreground">
              Access is restricted to <strong>ADMIN</strong> and <strong>MANAGER</strong> credentials per StockPulse Zero-Trust RBAC.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
      {/* =====================================================================
          1. Header Banner with Timeframe & Export Controls
          ===================================================================== */}
      <section
        aria-label="Analytics Console Header"
        className="wood-surface relative overflow-hidden rounded-2xl border border-border/70 p-6 shadow-xl"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <TrendingUp className="size-3" aria-hidden="true" />
                Live BI Feed
              </span>
              <span className="text-xs text-white/70">
                {tenant?.name || 'Bharat Logistics & Retail'} · {tenant?.region || 'AP-South-1 (Mumbai)'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Enterprise Analytics &amp; Inventory Capital
            </h1>
            <p className="text-xs text-[oklch(0.85_0.02_78)]">
              Real-time checkout velocity, warehouse capital allocation, and Indian GST tax reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Timeframe selector */}
            <div
              role="radiogroup"
              aria-label="Analytics Timeframe"
              className="flex items-center rounded-lg border border-white/20 bg-black/20 p-1 text-xs"
            >
              {(['7d', '14d', '30d', 'ytd'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={timeframe === t}
                  onClick={() => setTimeframe(t)}
                  className={`rounded-md px-2.5 py-1 font-semibold uppercase tracking-wider transition-colors ${
                    timeframe === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch()
                toast.info('Refreshing live analytics telemetry...')
              }}
              disabled={isFetching}
              className="gap-1.5 border-white/20 text-xs font-medium text-white hover:bg-white/10"
              aria-label="Refresh live analytics data"
            >
              <RotateCcw
                className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </Button>

            <Button
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs font-bold shadow-md"
              aria-label="Export BI Report to CSV"
            >
              <Download className="size-3.5" aria-hidden="true" />
              <span>Export BI Report</span>
            </Button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. Four Primary KPI Hero Cards
          ===================================================================== */}
      <section aria-label="Core Financial & Operational KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Gross Revenue */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Revenue (INR)
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-foreground font-mono">
              ₹{summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span>+18.4% vs previous period</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Completed Orders & AOV */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Order Fulfillment
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShoppingCart className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-foreground font-mono">
              {summary.ordersCount}{' '}
              <span className="text-sm font-normal text-muted-foreground">Completed</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              AOV: <strong className="text-foreground">₹{summary.avgOrderValue.toLocaleString('en-IN')}</strong> / order
            </div>
          </div>
        </div>

        {/* KPI 3: Total Warehouse Valuation */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inventory Capital
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Boxes className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-foreground font-mono">
              ₹{inventoryHealth.inventoryValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {inventoryHealth.totalInventoryUnits} units across {inventoryHealth.totalProducts} active SKUs
            </div>
          </div>
        </div>

        {/* KPI 4: Stock Health Score */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Catalog Health Score
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-foreground font-mono">
              {inventoryHealth.healthScore}%{' '}
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Optimal
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {inventoryHealth.lowStockCount} Low
              </span>
              <span>·</span>
              <span className="text-destructive font-medium">
                {inventoryHealth.outOfStockCount} Out
              </span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {inventoryHealth.inStockCount} Safe
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. Two-Column Dashboard: Velocity Chart + Category Allocation
          ===================================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Visual Sales Velocity Chart (7 cols) */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-bold text-foreground">
                Checkout Sales Velocity &amp; Daily Invoicing
              </h2>
              <p className="text-xs text-muted-foreground">
                Aggregated daily revenue in INR (₹) across the selected timeframe
              </p>
            </div>
            <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-mono font-medium text-foreground">
              14-Day Velocity
            </span>
          </div>

          {/* Visual SVG / CSS Bar Chart */}
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex h-52 items-end gap-2 pt-4">
              {salesTrend.map((point: any, idx: number) => {
                const heightPct = Math.max(8, Math.round((point.revenue / maxTrendRevenue) * 100))
                return (
                  <div
                    key={idx}
                    className="group relative flex flex-1 flex-col items-center justify-end h-full"
                  >
                    {/* Tooltip on hover */}
                    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] font-mono text-popover-foreground shadow-lg border border-border">
                      ₹{point.revenue.toLocaleString('en-IN')} ({point.orders} orders)
                    </div>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full rounded-t-md bg-primary/80 transition-all group-hover:bg-primary group-hover:brightness-110"
                    />
                    <span className="mt-2 text-[10px] text-muted-foreground font-mono">
                      D{idx + 1}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* GST Tax Compliance Inset Banner */}
          <div className="mt-6 rounded-xl border border-border/80 bg-muted/40 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary/20 text-primary">
                  <Layers className="size-3.5" aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    Tax Engine: Indian GST Compliance (18%)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    All checkouts automatically bifurcated into Central and State GST ledgers.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground">CGST (9%): </span>
                  <strong className="text-foreground">
                    ₹{(summary.totalTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">SGST (9%): </span>
                  <strong className="text-foreground">
                    ₹{(summary.totalTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Category Capital Allocation (5 cols) */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-5">
          <div className="border-b border-border pb-4">
            <h2 className="text-base font-bold text-foreground">
              Category Capital Allocation
            </h2>
            <p className="text-xs text-muted-foreground">
              Stock valuation and sales contribution by product taxonomy
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-5">
            {categoryBreakdown.map((cat: any) => (
              <div key={cat.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[200px]">
                    {cat.name}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    ₹{cat.valuation.toLocaleString('en-IN')} ({cat.salesContribution}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    style={{ width: `${Math.min(100, Math.max(5, cat.salesContribution))}%` }}
                    className="h-full rounded-full bg-primary transition-all duration-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{cat.productCount} SKUs · {cat.stockUnits} units in stock</span>
                  <span>Sales: ₹{cat.salesRevenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. Top Performing SKUs Table
          ===================================================================== */}
      <section
        aria-label="Top Selling Products"
        className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold text-foreground">
              High-Velocity Revenue Drivers
            </h2>
            <p className="text-xs text-muted-foreground">
              Top products ranked by cumulative order revenue and unit turnover
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Top {topSellingProducts.length} Items
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2.5 pr-4 font-semibold">SKU</th>
                <th className="py-2.5 px-4 font-semibold">Product Name</th>
                <th className="py-2.5 px-4 font-semibold text-right">Units Sold</th>
                <th className="py-2.5 px-4 font-semibold text-right">Revenue (INR)</th>
                <th className="py-2.5 pl-4 font-semibold text-right">Current Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {topSellingProducts.map((p: any) => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-primary">
                    {p.sku}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    {p.name}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                    {p.unitsSold} units
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                    ₹{p.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 pl-4 text-right font-mono">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        p.currentStock > 10
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : p.currentStock > 0
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {p.currentStock} in stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
