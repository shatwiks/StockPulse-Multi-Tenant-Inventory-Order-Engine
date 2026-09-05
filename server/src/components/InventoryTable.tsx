import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
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
  AlertCircle,
  RotateCcw,
  Check,
  Copy,
} from 'lucide-react';
import { ProductStatus } from '@prisma/client';

// ============================================================================
// 1. Strongly-Typed TypeScript Interfaces
// ============================================================================

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  organizationId: string;
  categoryId?: string | null;
  category?: ProductCategory | null;
  sku: string;
  name: string;
  description?: string | null;
  unitPrice: number | string;
  costPrice?: number | string | null;
  stockQuantity: number;
  reorderPoint: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: ProductCategory[];
}

export interface InventoryTableProps {
  organizationId?: string;
  organizationName?: string;
  apiBaseUrl?: string;
}

// ============================================================================
// 2. Component Implementation
// ============================================================================

function cn(...classes: (string | undefined | null | false | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

const controlClass =
  'h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500';

export function InventoryTable({
  organizationId = '00000000-0000-0000-0000-000000000001',
  organizationName = 'Acme Corp',
  apiBaseUrl = '',
}: InventoryTableProps) {
  const queryClient = useQueryClient();

  // Filter & Pagination State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [rawSearch, setRawSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<'sku' | 'price' | 'stock'>('sku');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);

  // Copied SKU feedback
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Accessible Label IDs
  const searchId = useId();
  const catFilterId = useId();
  const statusFilterId = useId();

  // --------------------------------------------------------------------------
  // Debounce search input (300ms)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(rawSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [rawSearch]);

  // --------------------------------------------------------------------------
  // TanStack Query: Fetch Categories
  // --------------------------------------------------------------------------
  const { data: categoriesData } = useQuery<CategoriesResponse>({
    queryKey: ['categories', { organizationId }],
    queryFn: async () => {
      const url = `${apiBaseUrl}/api/v1/categories?organizationId=${organizationId}`;
      const res = await fetch(url);
      if (!res.ok) return { success: true, data: [] };
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const categories = categoriesData?.data ?? [];

  // --------------------------------------------------------------------------
  // TanStack Query: Fetch Products with Pagination, Search & Filters
  // --------------------------------------------------------------------------
  const {
    data: productsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<ProductsResponse>({
    queryKey: [
      'products',
      {
        organizationId,
        page,
        limit: pageSize,
        search: debouncedSearch,
        status: statusFilter,
        categoryId: selectedCategory,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        organizationId,
        page: String(page),
        limit: String(pageSize),
      });

      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (selectedCategory !== 'ALL') {
        params.append('categoryId', selectedCategory);
      }

      const res = await fetch(`${apiBaseUrl}/api/v1/products?${params.toString()}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorJson.message || `Failed to fetch products (HTTP ${res.status})`);
      }
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  const productsList = productsResponse?.data ?? [];
  const pagination = productsResponse?.pagination ?? {
    page: 1,
    limit: pageSize,
    totalCount: productsList.length,
    totalPages: Math.max(1, Math.ceil(productsList.length / pageSize)),
  };

  // Client-side Sort of the current page rows
  const sortedProducts = useMemo(() => {
    return [...productsList].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'sku') cmp = a.sku.localeCompare(b.sku);
      else if (sortKey === 'price') cmp = Number(a.unitPrice) - Number(b.unitPrice);
      else cmp = a.stockQuantity - b.stockQuantity;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [productsList, sortKey, sortDir]);

  // --------------------------------------------------------------------------
  // TanStack Query: Mutations with Cache Invalidation
  // --------------------------------------------------------------------------
  // 1. Adjust Stock Mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ productId, newStock }: { productId: string; newStock: number }) => {
      const res = await fetch(`${apiBaseUrl}/api/v1/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Failed to adjust stock');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setAdjustProduct(null);
    },
  });

  // 2. Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: async (newProduct: {
      sku: string;
      name: string;
      categoryId?: string;
      unitPrice: number;
      costPrice?: number;
      stockQuantity: number;
      reorderPoint: number;
      status: ProductStatus;
      description?: string;
    }) => {
      const res = await fetch(`${apiBaseUrl}/api/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, organizationId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Failed to create product');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddOpen(false);
    },
  });

  // 3. Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`${apiBaseUrl}/api/v1/products/${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Failed to delete product');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // --------------------------------------------------------------------------
  // Selection Logic
  // --------------------------------------------------------------------------
  const allCurrentPageSelected =
    sortedProducts.length > 0 && sortedProducts.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      sortedProducts.forEach((p) => next.delete(p.id));
    } else {
      sortedProducts.forEach((p) => next.add(p.id));
    }
    setSelectedIds(next);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Unit Price', 'Current Stock', 'Reorder Point', 'Status'];
    const rows = sortedProducts.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category?.name ?? 'General'}"`,
      Number(p.unitPrice).toFixed(2),
      p.stockQuantity,
      p.reorderPoint,
      p.status,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StockCatalog_${organizationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* =====================================================================
          1. Header Area within Main Content Block (Walnut Wood-Grain Hero)
          ===================================================================== */}
      <section className="wood-surface relative overflow-hidden rounded-2xl border border-border/70 p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Boxes className="size-3.5" aria-hidden="true" />
                Stock Catalog
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-xs font-mono text-[oklch(0.88_0.02_78)]">
                <Building2 className="size-3.5 text-primary" aria-hidden="true" />
                Org: {organizationName}
              </span>
              <span className="inline-flex items-center rounded-md border border-white/15 bg-black/40 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {pagination.totalCount} Items
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-balance text-white">
              Stock Catalog &amp; Live Inventory Ledger
            </h1>
            <p className="max-w-md text-xs text-pretty text-[oklch(0.82_0.02_78)]">
              Real-time TanStack Query synchronization with PostgreSQL backend. Changes invalidate cache atomically.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/20 bg-black/40 hover:bg-white/10 text-white text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Export catalog to CSV"
            >
              <Download className="size-3.5" aria-hidden="true" />
              <span>CSV Export</span>
            </button>

            {/* Prominent Add New Product Button */}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isAddOpen}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. Sticky Filter & Control Panel
          ===================================================================== */}
      <section
        aria-label="Inventory Controls"
        className="sticky top-[58px] z-20 backdrop-blur-md bg-background/95 py-3 border-b border-border/80 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-1"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          {/* Debounced Search Input with Explicit Label */}
          <div className="relative flex-1 sm:w-80">
            <label htmlFor={searchId} className="sr-only">
              Search inventory by SKU, product name, or description
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
                aria-label="Clear search"
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
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className={controlClass}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={controlClass}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">In Stock (Active)</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="DRAFT">Draft</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live sync indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          {isFetching && !isLoading && (
            <span className="inline-flex items-center gap-1 text-primary animate-pulse">
              <RotateCcw className="size-3 animate-spin" /> Syncing…
            </span>
          )}
          <span>{pagination.totalCount} products matching</span>
        </div>
      </section>

      {/* =====================================================================
          3. Error Boundary with Retry Button
          ===================================================================== */}
      {isError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-destructive flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Unable to load live inventory records
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {error?.message || 'A network error occurred while connecting to GET /api/v1/products.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-accent text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <RotateCcw className="size-3.5" />
            <span>Retry Request</span>
          </button>
        </div>
      )}

      {/* =====================================================================
          4. Accessible Data-Dense Table (<table scope="col">)
          ===================================================================== */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[760px] border-collapse text-xs"
            aria-busy={isLoading || isFetching}
          >
            <caption className="sr-only">
              Live B2B Inventory Management Table: {pagination.totalCount} products.
            </caption>

            <thead>
              <tr className="border-b border-border bg-muted/50 text-left font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                {/* Batch Selection Header */}
                <th scope="col" className="w-10 px-4 py-3 text-center">
                  <span className="sr-only">Select all items on current page</span>
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all products on current page"
                    className="size-4 rounded border-input accent-primary cursor-pointer"
                  />
                </th>

                {/* SKU */}
                <th scope="col" className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortKey === 'sku') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortKey('sku');
                        setSortDir('asc');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-foreground"
                  >
                    <span>SKU</span>
                    <ArrowUpDown className="size-3.5 opacity-60" />
                  </button>
                </th>

                {/* Product Name */}
                <th scope="col" className="px-4 py-3 min-w-[220px]">
                  Product Name
                </th>

                {/* Category */}
                <th scope="col" className="px-4 py-3">
                  Category
                </th>

                {/* Unit Price */}
                <th scope="col" className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortKey === 'price') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortKey('price');
                        setSortDir('asc');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-foreground flex-row-reverse"
                  >
                    <span>Unit Price</span>
                    <ArrowUpDown className="size-3.5 opacity-60" />
                  </button>
                </th>

                {/* Current Stock */}
                <th scope="col" className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortKey === 'stock') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortKey('stock');
                        setSortDir('asc');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-foreground"
                  >
                    <span>Current Stock</span>
                    <ArrowUpDown className="size-3.5 opacity-60" />
                  </button>
                </th>

                {/* Status */}
                <th scope="col" className="px-4 py-3">
                  Status
                </th>

                {/* Actions */}
                <th scope="col" className="w-12 px-4 py-3 text-center">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {/* =============================================================
                  Accessible Loading Skeletons during fetch states
                  ============================================================= */}
              {isLoading ? (
                <>
                  <tr className="sr-only">
                    <td colSpan={8}>
                      <div role="status">Loading updated inventory records…</div>
                    </td>
                  </tr>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="animate-pulse">
                      <td className="px-4 py-3.5 text-center">
                        <div className="size-4 rounded bg-muted/70 mx-auto" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-3.5 w-24 rounded bg-muted/80" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-muted/80 shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3.5 w-44 rounded bg-muted/80" />
                            <div className="h-2.5 w-28 rounded bg-muted/50" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-5 w-20 rounded-md bg-muted/70" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="h-3.5 w-16 rounded bg-muted/80 ml-auto" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1 w-28">
                          <div className="h-3 w-14 rounded bg-muted/80" />
                          <div className="h-1.5 w-full rounded bg-muted/50" />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-5 w-20 rounded-full bg-muted/70" />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="size-6 rounded bg-muted/60 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground">
                    <PackageX className="size-8 mx-auto opacity-60 mb-2" />
                    <p className="text-sm font-semibold text-foreground">No inventory records found</p>
                    <p className="text-xs mt-0.5">Try clearing active search filters or add a new product.</p>
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  const isLow = product.stockQuantity > 0 && product.stockQuantity <= product.reorderPoint;
                  const isOut = product.stockQuantity === 0;

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        'transition-colors hover:bg-accent/40',
                        isSelected && 'bg-primary/5'
                      )}
                    >
                      {/* Batch Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(product.id)}
                          aria-label={`Select product ${product.name}`}
                          className="size-4 rounded border-input accent-primary cursor-pointer"
                        />
                      </td>

                      {/* SKU with Copy Feedback */}
                      <td className="px-4 py-3 font-mono text-[11px] font-semibold text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 group">
                          <span>{product.sku}</span>
                          <button
                            type="button"
                            onClick={() => handleCopySku(product.sku)}
                            title="Copy SKU"
                            className="p-0.5 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedSku === product.sku ? (
                              <Check className="size-3 text-success" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                            <span className="sr-only">Copy SKU {product.sku}</span>
                          </button>
                        </div>
                      </td>

                      {/* Product Name & 40x40 Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-indigo-500/15 border border-border text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {product.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{product.name}</p>
                            {product.description && (
                              <p className="text-[11px] text-muted-foreground truncate">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                          {product.category?.name ?? 'General'}
                        </span>
                      </td>

                      {/* Unit Price ($ USD) */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground tabular-nums whitespace-nowrap">
                        ${Number(product.unitPrice).toFixed(2)}
                      </td>

                      {/* Current Stock (Numerical + Low-Stock Progress Bar) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex w-32 flex-col gap-1">
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span
                              className={cn(
                                'font-bold font-mono',
                                isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-foreground'
                              )}
                            >
                              {product.stockQuantity} units
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              reorder {product.reorderPoint}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div
                            className="h-1.5 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-valuenow={product.stockQuantity}
                            aria-valuemin={0}
                            aria-valuemax={Math.max(product.reorderPoint * 2, product.stockQuantity, 10)}
                            aria-label={`${product.name} stock level`}
                          >
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-300',
                                isOut ? 'bg-danger' : isLow ? 'bg-warning' : 'bg-success'
                              )}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    isOut ? 0 : 8,
                                    (product.stockQuantity /
                                      Math.max(product.reorderPoint * 2, product.stockQuantity, 10)) *
                                      100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {product.stockQuantity === 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/15 px-2.5 py-0.5 text-xs font-semibold text-danger">
                            <span className="size-1.5 rounded-full bg-danger" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
                            <span className="size-1.5 rounded-full bg-warning" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                            <span className="size-1.5 rounded-full bg-success" />
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Row Actions Menu */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAdjustProduct(product)}
                            title="Adjust Physical Stock"
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <SlidersHorizontal className="size-3.5" />
                            <span className="sr-only">Adjust stock for {product.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete product '${product.name}' (SKU: ${product.sku})?`)) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
                            title="Delete Product"
                            className="p-1 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete product {product.name}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================================
            5. Keyboard-Navigable Pagination (1, 2, 3, >)
            ===================================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <p>
            Showing{' '}
            <span className="font-semibold text-foreground">
              {pagination.totalCount === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{pagination.totalCount}</span> entries
          </p>

          <nav className="flex items-center gap-1" aria-label="Inventory Pagination">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent"
            >
              &lt;
              <span className="sr-only">Previous page</span>
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === pagination.page ? 'page' : undefined}
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  n === pagination.page
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent"
            >
              &gt;
              <span className="sr-only">Next page</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Add Product Modal Dialog */}
      {isAddOpen && (
        <AddProductModalDialog
          categories={categories}
          isSubmitting={createProductMutation.isPending}
          onClose={() => setIsAddOpen(false)}
          onSave={(payload) => createProductMutation.mutate(payload)}
        />
      )}

      {/* Adjust Stock Quick Modal Dialog */}
      {adjustProduct && (
        <AdjustStockDialog
          product={adjustProduct}
          isSubmitting={adjustStockMutation.isPending}
          onClose={() => setAdjustProduct(null)}
          onSave={(newStock) =>
            adjustStockMutation.mutate({ productId: adjustProduct.id, newStock })
          }
        />
      )}
    </div>
  );
}

// ============================================================================
// Add Product Modal Component
// ============================================================================
function AddProductModalDialog({
  categories,
  isSubmitting,
  onClose,
  onSave,
}: {
  categories: ProductCategory[];
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (data: {
    sku: string;
    name: string;
    categoryId?: string;
    unitPrice: number;
    costPrice?: number;
    stockQuantity: number;
    reorderPoint: number;
    status: ProductStatus;
    description?: string;
  }) => void;
}) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [unitPrice, setUnitPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [reorderPoint, setReorderPoint] = useState('10');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || !unitPrice) {
      setError('SKU, Name, and Unit Price are required.');
      return;
    }
    if (Number(stockQuantity) < 0) {
      setError('Stock quantity cannot be negative (CHECK constraint stock_quantity >= 0).');
      return;
    }

    onSave({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      categoryId: categoryId || undefined,
      unitPrice: parseFloat(unitPrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      reorderPoint: parseInt(reorderPoint, 10) || 10,
      status: Number(stockQuantity) === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
      description: description.trim() || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            <h2 id="modal-add-title" className="text-base font-bold text-foreground">
              Add New Product
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            ✕
            <span className="sr-only">Close add product modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-sku" className="block font-semibold text-muted-foreground mb-1">
                SKU *
              </label>
              <input
                id="modal-sku"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. ASD-SEN-100"
                className="w-full h-8 px-2.5 rounded border border-input bg-background font-mono uppercase text-foreground"
              />
            </div>

            <div>
              <label htmlFor="modal-cat" className="block font-semibold text-muted-foreground mb-1">
                Category
              </label>
              <select
                id="modal-cat"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-input bg-background text-foreground"
              >
                <option value="">General</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="modal-name" className="block font-semibold text-muted-foreground mb-1">
              Product Name *
            </label>
            <input
              id="modal-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Industrial Vibration Sensor"
              className="w-full h-8 px-2.5 rounded border border-input bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label htmlFor="modal-price" className="block font-semibold text-muted-foreground mb-1">
                Price ($) *
              </label>
              <input
                id="modal-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full h-8 px-2 rounded border border-input bg-background font-mono text-foreground"
              />
            </div>

            <div>
              <label htmlFor="modal-cost" className="block font-semibold text-muted-foreground mb-1">
                Cost ($)
              </label>
              <input
                id="modal-cost"
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full h-8 px-2 rounded border border-input bg-background font-mono text-foreground"
              />
            </div>

            <div>
              <label htmlFor="modal-stock" className="block font-semibold text-muted-foreground mb-1">
                Stock *
              </label>
              <input
                id="modal-stock"
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full h-8 px-2 rounded border border-input bg-background font-mono font-bold text-foreground"
              />
            </div>

            <div>
              <label htmlFor="modal-reorder" className="block font-semibold text-muted-foreground mb-1">
                Reorder Pt
              </label>
              <input
                id="modal-reorder"
                type="number"
                min="0"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
                className="w-full h-8 px-2 rounded border border-input bg-background font-mono text-foreground"
              />
            </div>
          </div>

          <div>
            <label htmlFor="modal-desc" className="block font-semibold text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              id="modal-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specifications, certifications…"
              className="w-full p-2 rounded border border-input bg-background text-foreground resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-border bg-card text-foreground hover:bg-accent text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Adjust Stock Modal Component
// ============================================================================
function AdjustStockDialog({
  product,
  isSubmitting,
  onClose,
  onSave,
}: {
  product: Product;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (newStock: number) => void;
}) {
  const [qty, setQty] = useState<number>(product.stockQuantity);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty < 0) {
      setError('Stock cannot be negative (CHECK constraint stock_quantity >= 0).');
      return;
    }
    onSave(qty);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-stock-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            <h3 id="adjust-stock-title" className="text-sm font-bold text-foreground">
              Adjust Physical Stock
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            ✕
            <span className="sr-only">Close adjust stock modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="p-2.5 rounded-lg border border-border bg-muted/40">
            <p className="font-mono font-semibold text-primary">{product.sku}</p>
            <p className="font-medium text-foreground truncate">{product.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Current Count: {product.stockQuantity} units
            </p>
          </div>

          <div>
            <label htmlFor="adjust-stock-count" className="block font-semibold text-muted-foreground mb-1">
              New Verified Stock Count
            </label>
            <input
              id="adjust-stock-count"
              type="number"
              min="0"
              required
              value={qty}
              onChange={(e) => {
                setQty(parseInt(e.target.value, 10) || 0);
                setError('');
              }}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {error && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-border bg-card text-foreground hover:bg-accent font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || qty < 0}
              className="px-4 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Updating…' : 'Save Count'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryTable;
