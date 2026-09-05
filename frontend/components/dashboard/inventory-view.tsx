'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Download,
  MoreHorizontal,
  Package,
  PackageX,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  Building2,
  SlidersHorizontal,
  Layers,
  X,
  AlertCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState, useId } from 'react'
import { Button } from '@/components/ui/button'
import { AddProductModal } from './add-product-modal'
import { Menu, MenuItem, MenuSeparator } from './menu'
import { StatusBadge } from './status-badge'
import {
  categories as fallbackCategories,
  categoryImage,
  categoryLabel,
  compactNumber,
  normalizeProduct,
  statusOf,
  usd,
  type CategoryKey,
  type Product,
  type StockStatus,
} from '@/lib/inventory-data'
import { type Tenant } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast-context'
import { useAuth } from '@/lib/auth-context'

type SortKey = 'sku' | 'price' | 'stock'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | StockStatus

const PAGE_SIZE = 8

const controlClass =
  'h-9 rounded-lg border border-input bg-card px-3 text-xs font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

interface InventoryViewProps {
  tenant?: Tenant
}

export function InventoryView({ tenant }: InventoryViewProps) {
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const [rawSearch, setRawSearch] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('sku')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)

  // Unique IDs for accessible labels
  const searchId = useId()
  const catFilterId = useId()
  const statusFilterId = useId()

  // Debounce search input by 300ms
  useEffect(() => {
    const id = setTimeout(() => setSearch(rawSearch), 300)
    return () => clearTimeout(id)
  }, [rawSearch])

  // Any filter change resets page
  useEffect(() => {
    setPage(1)
  }, [search, category, status])

  // Query live categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', tenant?.id],
    queryFn: async () => {
      const res = await apiClient.get('categories')
      return res.data || []
    },
  })

  // Construct query string for products API
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(PAGE_SIZE))
    if (search.trim()) params.set('search', search.trim())
    if (category !== 'all') params.set('category', category)
    if (status !== 'all') {
      const statusMap: Record<StockStatus, string> = {
        'in-stock': 'IN_STOCK',
        'low-stock': 'LOW_STOCK',
        'out-of-stock': 'OUT_OF_STOCK',
      }
      params.set('status', statusMap[status] || status)
    }
    return params.toString()
  }, [page, search, category, status])

  // Hook useQuery for live products
  const {
    data: productsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['products', tenant?.id, page, search, category, status],
    queryFn: async () => {
      return await apiClient.get(`products?${queryParams}`)
    },
  })

  // Stock Adjustment Mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      return await apiClient.patch(`products/${id}/stock`, {
        adjustmentQuantity: delta,
      })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(
        `Physical inventory updated for ${res.data?.sku || 'SKU'}. New verified count: ${res.data?.newStock}`,
        'Stock Adjusted'
      )
      setAdjustProduct(null)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to adjust stock', 'Adjustment Error')
    },
  })

  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted from inventory.', 'Catalog Updated')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete product', 'Delete Error')
    },
  })

  // Normalize items from response
  const rawItems: Product[] = useMemo(() => {
    if (!productsResponse?.data) return []
    return productsResponse.data.map(normalizeProduct)
  }, [productsResponse])

  // Client-side sort on the active page
  const pageRows = useMemo(() => {
    const sorted = [...rawItems].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'sku') cmp = a.sku.localeCompare(b.sku)
      else if (sortKey === 'price') cmp = a.price - b.price
      else cmp = a.stock - b.stock
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [rawItems, sortKey, sortDir])

  const meta = productsResponse?.meta || { total: rawItems.length, page: 1, totalPages: 1 }
  const totalItems = meta.total || rawItems.length
  const totalPages = Math.max(1, meta.totalPages || 1)
  const currentPage = Math.min(page, totalPages)

  const lowCount = rawItems.filter((p) => statusOf(p) === 'low-stock').length
  const outCount = rawItems.filter((p) => statusOf(p) === 'out-of-stock').length

  const pageIds = pageRows.map((p) => p.id)
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id))

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (sortKey !== key) return 'none'
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })
  }

  // Real CSV Export Handler
  function handleExportCSV() {
    const headers = ['SKU', 'Name', 'Category', 'Unit Price (INR)', 'Current Stock', 'Reorder Point', 'Status']
    const rows = pageRows.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${categoryLabel[p.category] || p.categoryName || p.category}"`,
      p.price.toFixed(2),
      p.stock,
      p.reorderPoint,
      statusOf(p),
    ])
    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `StockCatalog_${(tenant?.name ?? 'Bharat_Retail').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* =====================================================================
          1. Header Area within Main Content Block (Walnut Wood-Grain Hero)
          ===================================================================== */}
      <section className="wood-surface relative overflow-hidden rounded-2xl border border-border/70 p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Boxes className="size-3.5" aria-hidden="true" />
                Stock Catalog
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-xs font-mono text-[oklch(0.88_0.02_78)]">
                <Building2 className="size-3.5 text-primary" aria-hidden="true" />
                Org: {tenant?.name ?? 'Bharat Logistics & Retail'}
              </span>
              <span className="inline-flex items-center rounded-md border border-white/15 bg-black/40 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {isLoading ? 'Loading...' : `${compactNumber(totalItems)} Items`}
              </span>
              {isFetching && !isLoading && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-mono">
                  <Loader2 className="size-3 animate-spin" /> Syncing...
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-balance text-white">
              Stock Catalog &amp; Inventory Ledger
            </h1>
            <p className="max-w-md text-xs text-pretty text-[oklch(0.82_0.02_78)]">
              Multi-tenant B2B inventory management ledger powered by TanStack Query and PostgreSQL row-level locks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Live Count KPI cards */}
            <dl className="grid grid-cols-3 gap-2.5 w-full sm:w-auto">
              <HeroStat
                label="Total SKUs"
                value={isLoading ? '...' : compactNumber(totalItems)}
                icon={<Package className="size-3.5" aria-hidden="true" />}
              />
              <HeroStat
                label="Low Stock"
                value={isLoading ? '...' : String(lowCount)}
                tone="warning"
                icon={<TriangleAlert className="size-3.5" aria-hidden="true" />}
              />
              <HeroStat
                label="Stockout"
                value={isLoading ? '...' : String(outCount)}
                tone="danger"
                icon={<PackageX className="size-3.5" aria-hidden="true" />}
              />
            </dl>

            {/* Header Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="gap-1.5 text-xs font-semibold border-white/20 hover:bg-white/10 text-white w-full sm:w-auto"
                aria-label="Export stock catalog to CSV"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>CSV Export</span>
              </Button>
              <Button
                onClick={() => {
                  if (role === 'CASHIER') {
                    toast.error(
                      'Access Denied: CASHIER role cannot add products. Requires ADMIN or MANAGER.',
                      'Insufficient Permissions'
                    )
                    return
                  }
                  setAddOpen(true)
                }}
                className="gap-1.5 text-xs font-bold shadow-lg w-full sm:w-auto shrink-0"
                aria-haspopup="dialog"
                aria-expanded={addOpen}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <span>Add New Product</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. Sticky Filter & Control Panel
          ===================================================================== */}
      <section
        aria-label="Inventory Filter Controls"
        className="sticky top-[58px] z-20 backdrop-blur-md bg-background/95 py-3 border-b border-border/80 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-1"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          {/* Debounced Search Input with Explicit Label */}
          <div className="relative flex-1 sm:w-80">
            <label htmlFor={searchId} className="sr-only">
              Search inventory by SKU, product name, or specifications
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="Search SKU or name (debounced 300ms)…"
              className={cn(controlClass, 'w-full pl-9 pr-8')}
            />
            {rawSearch && (
              <button
                type="button"
                onClick={() => setRawSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Clear search input"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor={catFilterId} className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Category:
              </label>
              <select
                id={catFilterId}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={controlClass}
              >
                <option value="all">All categories</option>
                {(categoriesData || fallbackCategories).map((c: any) => (
                  <option key={c.id || c.key} value={c.id || c.key}>
                    {c.name || c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor={statusFilterId} className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Status:
              </label>
              <select
                id={statusFilterId}
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className={controlClass}
              >
                <option value="all">All stock statuses</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Batch Selection Bar */}
        {selected.size > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary font-semibold"
          >
            <span>{selected.size} selected</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="h-6 text-[11px] px-2"
            >
              Clear
            </Button>
          </div>
        )}
      </section>

      {/* =====================================================================
          3. Error State with Accessible Retry Button
          ===================================================================== */}
      {isError && (
        <div
          role="alert"
          className="flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-destructive/40 bg-destructive/10"
        >
          <AlertCircle className="size-8 text-destructive mb-2" aria-hidden="true" />
          <h3 className="text-base font-bold text-foreground">Failed to load inventory data</h3>
          <p className="text-xs text-muted-foreground max-w-md mt-1">
            {(error as any)?.message || 'An unexpected error occurred while communicating with the backend API.'}
          </p>
          <Button
            onClick={() => refetch()}
            className="mt-4 gap-2 font-semibold"
            variant="default"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span>Retry Connection</span>
          </Button>
        </div>
      )}

      {/* =====================================================================
          4. Accessible Data Table with WCAG 2.1 AA Compliant Contrast
          ===================================================================== */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th scope="col" className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={togglePage}
                    aria-label="Select all products on current page"
                    className="size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </th>
                <SortHeader
                  label="SKU"
                  active={sortKey === 'sku'}
                  dir={sortDir}
                  ariaSort={ariaSort('sku')}
                  onClick={() => toggleSort('sku')}
                />
                <th scope="col" className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Product Name
                </th>
                <th scope="col" className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Category
                </th>
                <SortHeader
                  label="Unit Price"
                  active={sortKey === 'price'}
                  dir={sortDir}
                  ariaSort={ariaSort('price')}
                  onClick={() => toggleSort('price')}
                  align="right"
                />
                <SortHeader
                  label="Current Stock"
                  active={sortKey === 'stock'}
                  dir={sortDir}
                  ariaSort={ariaSort('stock')}
                  onClick={() => toggleSort('stock')}
                />
                <th scope="col" className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th scope="col" className="w-16 px-4 py-3 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {/* Skeleton Loading State to Prevent Layout Shift */}
              {isLoading &&
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-4 py-3.5 text-center">
                      <div className="size-4 rounded bg-muted/50 mx-auto" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-20 rounded bg-muted/50" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-muted/50 shrink-0" />
                        <div className="space-y-1.5 w-full max-w-xs">
                          <div className="h-4 w-48 rounded bg-muted/50" />
                          <div className="h-2.5 w-24 rounded bg-muted/30" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-24 rounded-md bg-muted/50" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-4 w-14 rounded bg-muted/50 ml-auto" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5 w-32">
                        <div className="h-3 w-16 rounded bg-muted/50" />
                        <div className="h-1.5 w-full rounded bg-muted/40" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-20 rounded-full bg-muted/50" />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="size-6 rounded bg-muted/40 mx-auto" />
                    </td>
                  </tr>
                ))}

              {!isLoading && !isError && pageRows.map((product) => {
                const st = statusOf(product)
                const isSelected = selected.has(product.id)

                return (
                  <tr
                    key={product.id}
                    className={cn(
                      'transition-colors hover:bg-accent/40',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    {/* Checkbox for batch select */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </td>

                    {/* SKU Column */}
                    <td className="px-4 py-3 font-mono font-bold text-primary whitespace-nowrap">
                      {product.sku}
                    </td>

                    {/* Product Name with Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                          <Image
                            src={categoryImage[product.category] || '/products/electrical.png'}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-xs">
                            {product.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {product.id.slice(0, 8)}…
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {categoryLabel[product.category] || product.categoryName || product.category}
                      </span>
                    </td>

                    {/* Unit Price (INR) */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground tabular-nums whitespace-nowrap">
                      {usd(product.price)}
                    </td>

                    {/* Current Stock (Numerical + Low-Stock Progress Bar) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StockCell product={product} status={st} />
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={st} />
                    </td>

                    {/* Row Actions Dropdown */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <RowActions
                        productName={product.name}
                        onAdjustStock={() => {
                          if (role === 'CASHIER') {
                            toast.error(
                              'Access Denied: CASHIER role cannot adjust inventory. Requires ADMIN or MANAGER.',
                              'Insufficient Permissions'
                            )
                            return
                          }
                          setAdjustProduct(product)
                        }}
                        onDelete={() => {
                          if (role === 'CASHIER') {
                            toast.error(
                              'Access Denied: CASHIER role cannot delete products.',
                              'Insufficient Permissions'
                            )
                            return
                          }
                          deleteProductMutation.mutate(product.id)
                        }}
                      />
                    </td>
                  </tr>
                )
              })}

              {!isLoading && !isError && pageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <PackageX className="size-8 opacity-60" aria-hidden="true" />
                      <p className="text-sm font-semibold text-foreground">
                        No catalog items match your criteria
                      </p>
                      <p className="text-xs">
                        Try refining your search keyword or clearing the filters above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================================
            5. Standard Keyboard-Navigable Pagination Controls (1, 2, 3, >)
            ===================================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <p>
            Showing{' '}
            <span className="font-semibold text-foreground">
              {totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * PAGE_SIZE, totalItems)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{totalItems}</span> entries
          </p>

          <nav className="flex items-center gap-1" aria-label="Catalog Pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="size-8 p-0"
            >
              &lt;
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === currentPage ? 'page' : undefined}
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  n === currentPage
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {n}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="size-8 p-0"
            >
              &gt;
            </Button>
          </nav>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />

      {/* Adjust Stock Quick Modal */}
      {adjustProduct && (
        <AdjustStockDialog
          product={adjustProduct}
          isPending={adjustStockMutation.isPending}
          onClose={() => setAdjustProduct(null)}
          onSave={(delta) => {
            adjustStockMutation.mutate({ id: adjustProduct.id, delta })
          }}
        />
      )}
    </div>
  )
}

function HeroStat({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone?: 'neutral' | 'warning' | 'danger'
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-xs">
      <div
        className={cn(
          'flex items-center gap-1.5 text-[11px] font-medium',
          tone === 'warning' && 'text-warning font-semibold',
          tone === 'danger' && 'text-danger font-semibold',
          tone === 'neutral' && 'text-[oklch(0.82_0.02_78)]'
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{value}</p>
    </div>
  )
}

function SortHeader({
  label,
  active,
  dir,
  ariaSort,
  onClick,
  align = 'left',
}: {
  label: string
  active: boolean
  dir: SortDir
  ariaSort: 'ascending' | 'descending' | 'none'
  onClick: () => void
  align?: 'left' | 'right'
}) {
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn('px-4 py-3', align === 'right' && 'text-right')}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md font-bold outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring text-[11px] uppercase tracking-wider',
          active ? 'text-foreground' : 'text-muted-foreground',
          align === 'right' && 'flex-row-reverse'
        )}
      >
        <span>{label}</span>
        {!active && (
          <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />
        )}
        {active && dir === 'asc' && (
          <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
        )}
        {active && dir === 'desc' && (
          <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
        )}
      </button>
    </th>
  )
}

function StockCell({
  product,
  status,
}: {
  product: Product
  status: StockStatus
}) {
  const stock = product.stock
  const reorder = product.reorderPoint
  const ratio = reorder > 0 ? Math.min(100, Math.round((stock / (reorder * 2)) * 100)) : 100

  return (
    <div className="flex flex-col gap-1 w-36">
      <div className="flex items-center justify-between text-xs font-mono">
        <span
          className={cn(
            'font-bold tabular-nums',
            status === 'out-of-stock' && 'text-danger font-semibold',
            status === 'low-stock' && 'text-warning font-semibold',
            status === 'in-stock' && 'text-foreground'
          )}
        >
          {compactNumber(stock)} units
        </span>
        <span className="text-[10px] text-muted-foreground">
          Reorder: {compactNumber(reorder)}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={stock}
        aria-valuemin={0}
        aria-valuemax={reorder * 2}
        aria-label={`Stock level for ${product.name}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60"
      >
        <div
          className={cn(
            'h-full transition-all duration-300',
            status === 'out-of-stock' && 'bg-danger w-0',
            status === 'low-stock' && 'bg-warning',
            status === 'in-stock' && 'bg-success'
          )}
          style={{ width: `${status === 'out-of-stock' ? 0 : ratio}%` }}
        />
      </div>
    </div>
  )
}

function RowActions({
  productName,
  onAdjustStock,
  onDelete,
}: {
  productName: string
  onAdjustStock: () => void
  onDelete: () => void
}) {
  return (
    <Menu
      align="end"
      label={`Actions for ${productName}`}
      trigger={(triggerProps) => (
        <button
          type="button"
          {...triggerProps}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Actions menu for ${productName}`}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <MenuItem
            onClick={() => {
              close()
              onAdjustStock()
            }}
          >
            <SlidersHorizontal className="size-3.5 text-primary" aria-hidden="true" />
            <span>Adjust Physical Stock</span>
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            onClick={() => {
              close()
              onDelete()
            }}
            className="text-danger data-[highlighted]:bg-danger/10 data-[highlighted]:text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            <span>Delete Product</span>
          </MenuItem>
        </>
      )}
    </Menu>
  )
}

function AdjustStockDialog({
  product,
  isPending,
  onClose,
  onSave,
}: {
  product: Product
  isPending?: boolean
  onClose: () => void
  onSave: (delta: number) => void
}) {
  const [newCount, setNewCount] = useState<number>(product.stock)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCount < 0) {
      setError('Stock cannot be negative (Database CHECK constraint stock_quantity >= 0).')
      return
    }
    const delta = newCount - product.stock
    onSave(delta)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-stock-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            <h3 id="adjust-stock-heading" className="text-sm font-bold text-foreground">
              Adjust Physical Stock
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
            <span className="sr-only">Close adjust stock dialog</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="p-2.5 rounded-lg border border-border bg-muted/40 text-xs">
            <p className="font-mono font-semibold text-primary">{product.sku}</p>
            <p className="font-medium text-foreground truncate">{product.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Current recorded balance: <span className="font-bold text-foreground">{product.stock} units</span>
            </p>
          </div>

          <div>
            <label htmlFor="adjust-input" className="block text-xs font-semibold text-muted-foreground mb-1">
              New Verified Count
            </label>
            <input
              id="adjust-input"
              type="number"
              min="0"
              required
              disabled={isPending}
              value={newCount}
              onChange={(e) => {
                setNewCount(parseInt(e.target.value, 10) || 0)
                setError('')
              }}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {error && (
              <p className="text-xs text-danger mt-1 flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isPending ? 'Saving...' : 'Save Count'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InventoryView
