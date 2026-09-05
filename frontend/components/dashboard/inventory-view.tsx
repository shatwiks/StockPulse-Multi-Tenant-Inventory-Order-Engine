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
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState, useId } from 'react'
import { Button } from '@/components/ui/button'
import { AddProductModal } from './add-product-modal'
import { Menu, MenuItem, MenuSeparator } from './menu'
import { StatusBadge } from './status-badge'
import {
  categories,
  categoryImage,
  categoryLabel,
  compactNumber,
  products as seedProducts,
  statusOf,
  usd,
  type CategoryKey,
  type Product,
  type StockStatus,
} from '@/lib/inventory-data'
import { type Tenant } from '@/lib/nav'
import { cn } from '@/lib/utils'

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
  const [items, setItems] = useState<Product[]>(seedProducts)
  const [rawSearch, setRawSearch] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | CategoryKey>('all')
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

  // Any filter/sort change returns to page 1
  useEffect(() => {
    setPage(1)
  }, [search, category, status, sortKey, sortDir])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = items.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      const matchesCategory = category === 'all' || p.category === category
      const matchesStatus = status === 'all' || statusOf(p) === status
      return matchesQuery && matchesCategory && matchesStatus
    })

    const sorted = [...rows].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'sku') cmp = a.sku.localeCompare(b.sku)
      else if (sortKey === 'price') cmp = a.price - b.price
      else cmp = a.stock - b.stock
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [items, search, category, status, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const lowCount = items.filter((p) => statusOf(p) === 'low-stock').length
  const outCount = items.filter((p) => statusOf(p) === 'out-of-stock').length

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

  function deleteProduct(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function deleteSelected() {
    setItems((prev) => prev.filter((p) => !selected.has(p.id)))
    setSelected(new Set())
  }

  // Real CSV Export Handler
  function handleExportCSV() {
    const headers = ['SKU', 'Name', 'Category', 'Unit Price (USD)', 'Current Stock', 'Reorder Point', 'Status']
    const rows = filtered.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${categoryLabel[p.category]}"`,
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
    link.setAttribute('download', `StockCatalog_${(tenant?.name ?? 'Acme_Corp').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
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
                Org: {tenant?.name ?? 'Acme Corp'}
              </span>
              <span className="inline-flex items-center rounded-md border border-white/15 bg-black/40 px-2.5 py-0.5 text-xs font-semibold text-primary">
                4,521 Items
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-balance text-white">
              Stock Catalog &amp; Inventory Ledger
            </h1>
            <p className="max-w-md text-xs text-pretty text-[oklch(0.82_0.02_78)]">
              Multi-tenant B2B inventory management ledger. Filter, sort, reconcile cycle counts, and trigger replenishment before stockouts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Live Count KPI cards */}
            <dl className="grid grid-cols-3 gap-2.5 w-full sm:w-auto">
              <HeroStat
                label="Total SKUs"
                value="4,521"
                icon={<Package className="size-3.5" aria-hidden="true" />}
              />
              <HeroStat
                label="Low Stock"
                value={String(lowCount)}
                tone="warning"
                icon={<TriangleAlert className="size-3.5" aria-hidden="true" />}
              />
              <HeroStat
                label="Stockout"
                value={String(outCount)}
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
                onClick={() => setAddOpen(true)}
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
              placeholder="Search SKU or name (debounced)…"
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
            {/* Category Filter Dropdown with Explicit Label */}
            <div className="flex items-center gap-1.5">
              <label htmlFor={catFilterId} className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Category:
              </label>
              <select
                id={catFilterId}
                value={category}
                onChange={(e) => setCategory(e.target.value as 'all' | CategoryKey)}
                className={controlClass}
              >
                <option value="all">All categories ({items.length})</option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter Dropdown with Explicit Label */}
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
                <option value="all">All Statuses</option>
                <option value="in-stock">In Stock (&gt; Reorder)</option>
                <option value="low-stock">Low Stock (≤ Reorder)</option>
                <option value="out-of-stock">Out of Stock (0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Summary Counter */}
        <div className="text-xs text-muted-foreground font-medium hidden lg:block">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> matching products
        </div>
      </section>

      {/* =====================================================================
          3. Batch Selection Toolbar (when rows selected)
          ===================================================================== */}
      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Batch Actions"
          className="flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px]">
              {selected.size}
            </span>
            <span className="font-semibold text-foreground">items selected for batch action</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear Selection
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs font-semibold"
              onClick={deleteSelected}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete Selected ({selected.size})
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. Accessible Data-Dense Table (<table scope="col">)
          ===================================================================== */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-xs">
            <caption className="sr-only">
              Stock Catalog Inventory Data Table: {filtered.length} products found.
            </caption>

            {/* Accessible Table Header with scope="col" */}
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                {/* Batch Checkbox */}
                <th scope="col" className="w-10 px-4 py-3 text-center">
                  <span className="sr-only">Select all items on this page</span>
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={togglePage}
                    aria-label="Select all products on current page"
                    className="size-4 rounded border-input accent-primary cursor-pointer"
                  />
                </th>

                {/* SKU with Sort Icon */}
                <SortHeader
                  label="SKU"
                  active={sortKey === 'sku'}
                  dir={sortDir}
                  ariaSort={ariaSort('sku')}
                  onClick={() => toggleSort('sku')}
                />

                {/* Product Name with 40x40 Thumbnail */}
                <th scope="col" className="px-4 py-3 min-w-[220px]">
                  Product Name
                </th>

                {/* Category Badge */}
                <th scope="col" className="px-4 py-3">
                  Category
                </th>

                {/* Unit Price ($ USD) */}
                <SortHeader
                  label="Unit Price"
                  active={sortKey === 'price'}
                  dir={sortDir}
                  ariaSort={ariaSort('price')}
                  onClick={() => toggleSort('price')}
                  align="right"
                />

                {/* Current Stock (Numerical + Progress Bar) */}
                <SortHeader
                  label="Current Stock"
                  active={sortKey === 'stock'}
                  dir={sortDir}
                  ariaSort={ariaSort('stock')}
                  onClick={() => toggleSort('stock')}
                />

                {/* Status Badge */}
                <th scope="col" className="px-4 py-3">
                  Status
                </th>

                {/* Actions Dropdown */}
                <th scope="col" className="w-12 px-4 py-3 text-center">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border/60">
              {pageRows.map((product) => {
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
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(product.id)}
                        aria-label={`Select product ${product.name}`}
                        className="size-4 rounded border-input accent-primary cursor-pointer"
                      />
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-foreground whitespace-nowrap">
                      {product.sku}
                    </td>

                    {/* Product Name with 40x40 Thumbnail Image */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Exactly 40x40 thumbnail image (size-10 = 2.5rem = 40px) */}
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                          <Image
                            src={categoryImage[product.category]}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {product.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {product.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {categoryLabel[product.category]}
                      </span>
                    </td>

                    {/* Unit Price ($ USD) */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground tabular-nums whitespace-nowrap">
                      {usd(product.price)}
                    </td>

                    {/* Current Stock (Numerical + Low-Stock Progress Bar) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StockCell product={product} status={st} />
                    </td>

                    {/* Status Badge (WCAG AA Compliant High Contrast Semantic Badges) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={st} />
                    </td>

                    {/* Row Actions Dropdown */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <RowActions
                        productName={product.name}
                        onAdjustStock={() => setAdjustProduct(product)}
                        onDelete={() => deleteProduct(product.id)}
                      />
                    </td>
                  </tr>
                )
              })}

              {pageRows.length === 0 && (
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
              {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * PAGE_SIZE, filtered.length)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{filtered.length}</span> entries
          </p>

          <nav className="flex items-center gap-1" aria-label="Catalog Pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
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
              disabled={currentPage >= totalPages}
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
        onCreate={(product) => setItems((prev) => [product, ...prev])}
      />

      {/* Adjust Stock Quick Modal */}
      {adjustProduct && (
        <AdjustStockDialog
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSave={(newStock) => {
            setItems((prev) =>
              prev.map((item) =>
                item.id === adjustProduct.id ? { ...item, stock: newStock } : item
              )
            )
            setAdjustProduct(null)
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
        {active &&
          (dir === 'asc' ? (
            <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
          ) : (
            <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
          ))}
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
  const ceiling = Math.max(product.reorderPoint * 2, product.stock, 1)
  const pct = Math.min(100, Math.round((product.stock / ceiling) * 100))

  const isOut = status === 'out-of-stock'
  const isLow = status === 'low-stock'

  const barColor = isOut
    ? 'bg-danger'
    : isLow
    ? 'bg-warning'
    : 'bg-success'

  return (
    <div className="flex w-32 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-1 text-[11px]">
        <span className={cn('font-bold font-mono', isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-foreground')}>
          {compactNumber(product.stock)} units
        </span>
        <span className="text-[10px] text-muted-foreground">
          min {compactNumber(product.reorderPoint)}
        </span>
      </div>

      {/* Accessible Progress Bar */}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted/80"
        role="progressbar"
        aria-valuenow={product.stock}
        aria-valuemin={0}
        aria-valuemax={ceiling}
        aria-label={`${product.name} stock level: ${product.stock} units`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${Math.max(pct, isOut ? 0 : 8)}%` }}
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
      label="Row actions"
      align="end"
      menuClassName="w-44"
      trigger={(triggerProps) => (
        <button
          type="button"
          {...triggerProps}
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
          <span className="sr-only">Open actions menu for {productName}</span>
        </button>
      )}
    >
      {({ close }) => (
        <>
          <MenuItem
            onClick={() => {
              close()
              alert(`Edit specifications for ${productName}`)
            }}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            <span>Edit Product</span>
          </MenuItem>
          <MenuItem
            onClick={() => {
              close()
              onAdjustStock()
            }}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            <span>Adjust Stock</span>
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            onClick={() => {
              onDelete()
              close()
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
  onClose,
  onSave,
}: {
  product: Product
  onClose: () => void
  onSave: (newStock: number) => void
}) {
  const [qty, setQty] = useState<number>(product.stock)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (qty < 0) {
      setError('Stock cannot be negative (CHECK constraint stock_quantity >= 0).')
      return
    }
    onSave(qty)
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
          <button type="button" onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground">
            <X className="size-4" />
            <span className="sr-only">Close adjust stock dialog</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="p-2.5 rounded-lg border border-border bg-muted/40 text-xs">
            <p className="font-mono font-semibold text-primary">{product.sku}</p>
            <p className="font-medium text-foreground truncate">{product.name}</p>
          </div>

          <div>
            <label htmlFor="adjust-input" className="block text-xs font-semibold text-muted-foreground mb-1">
              New Verified Stock Count
            </label>
            <input
              id="adjust-input"
              type="number"
              min="0"
              required
              value={qty}
              onChange={(e) => {
                setQty(parseInt(e.target.value, 10) || 0)
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
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Count
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InventoryView
