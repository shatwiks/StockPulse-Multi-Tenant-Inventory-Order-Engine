import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Download,
  Plus,
  MoreVertical,
  Edit2,
  SlidersHorizontal,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Layers,
  Filter,
} from 'lucide-react';
import {
  InventoryProduct,
  CategoryOption,
  StockFilterType,
  ProductStatus,
  NewProductFormData,
} from './types';
import { mockCategories, initialMockProducts } from './mockData';
import { AddProductDialog } from './AddProductDialog';
import { StockAdjustModal } from './StockAdjustModal';

interface InventoryDataTableProps {
  initialProducts?: InventoryProduct[];
  categories?: CategoryOption[];
  organizationName?: string;
}

export const InventoryDataTable: React.FC<InventoryDataTableProps> = ({
  initialProducts = initialMockProducts,
  categories = mockCategories,
  organizationName = 'AeroShield Dynamics Corp.',
}) => {
  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  const [products, setProducts] = useState<InventoryProduct[]>(initialProducts);

  // Search & Filter state
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState<StockFilterType>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selection & Batch Action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Dialogs state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [adjustModalProduct, setAdjustModalProduct] = useState<InventoryProduct | null>(null);

  // Active row dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Copied SKU state for feedback
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Header checkbox indeterminate ref
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // 1. Debounced Search (300ms)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1); // Reset to first page on query change
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // --------------------------------------------------------------------------
  // 2. Filter & Sort Pipeline
  // --------------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // A. Text Search (SKU, Name, Description)
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const matchesSku = item.sku.toLowerCase().includes(query);
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) ?? false;
        if (!matchesSku && !matchesName && !matchesDesc) return false;
      }

      // B. Category Filter
      if (selectedCategory !== 'ALL' && item.categoryId !== selectedCategory) {
        return false;
      }

      // C. Stock Status Filter
      if (selectedStockStatus === 'IN_STOCK') {
        if (item.stockQuantity <= 0) return false;
      } else if (selectedStockStatus === 'LOW_STOCK') {
        if (item.stockQuantity <= 0 || item.stockQuantity > item.reorderPoint) return false;
      } else if (selectedStockStatus === 'OUT_OF_STOCK') {
        if (item.stockQuantity > 0) return false;
      }

      return true;
    });
  }, [products, debouncedSearch, selectedCategory, selectedStockStatus]);

  // --------------------------------------------------------------------------
  // 3. Pagination Slicing
  // --------------------------------------------------------------------------
  const totalEntries = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, validPage, pageSize]);

  // --------------------------------------------------------------------------
  // 4. Batch Selection Logic & Indeterminate Checkbox
  // --------------------------------------------------------------------------
  const allCurrentPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.has(p.id));

  const someCurrentPageSelected =
    paginatedProducts.some((p) => selectedIds.has(p.id)) && !allCurrentPageSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someCurrentPageSelected;
    }
  }, [someCurrentPageSelected]);

  const toggleSelectAll = () => {
    const nextSelected = new Set(selectedIds);
    if (allCurrentPageSelected) {
      paginatedProducts.forEach((p) => nextSelected.delete(p.id));
    } else {
      paginatedProducts.forEach((p) => nextSelected.add(p.id));
    }
    setSelectedIds(nextSelected);
  };

  const toggleRowSelect = (id: string) => {
    const nextSelected = new Set(selectedIds);
    if (nextSelected.has(id)) {
      nextSelected.delete(id);
    } else {
      nextSelected.add(id);
    }
    setSelectedIds(nextSelected);
  };

  // --------------------------------------------------------------------------
  // 5. SKU Copy Feedback
  // --------------------------------------------------------------------------
  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  // --------------------------------------------------------------------------
  // 6. CSV Export Functionality
  // --------------------------------------------------------------------------
  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Name',
      'Category',
      'Unit Price',
      'Cost Price',
      'Stock Quantity',
      'Reorder Point',
      'Status',
    ];

    const rows = filteredProducts.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.categoryName ?? 'Uncategorized'}"`,
      p.unitPrice.toFixed(2),
      p.costPrice.toFixed(2),
      p.stockQuantity,
      p.reorderPoint,
      p.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StockCatalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --------------------------------------------------------------------------
  // 7. Actions: Add, Adjust Stock, Delete
  // --------------------------------------------------------------------------
  const handleAddProduct = (formData: NewProductFormData) => {
    const matchedCategory = categories.find((c) => c.id === formData.categoryId);
    const newProduct: InventoryProduct = {
      id: `prod-${Date.now()}`,
      organizationId: 'org-aero-01',
      categoryId: formData.categoryId,
      categoryName: matchedCategory?.name ?? 'General',
      sku: formData.sku,
      name: formData.name,
      description: formData.description,
      unitPrice: formData.unitPrice,
      costPrice: formData.costPrice,
      stockQuantity: formData.stockQuantity,
      reorderPoint: formData.reorderPoint,
      status: formData.stockQuantity === 0 ? 'OUT_OF_STOCK' : formData.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleConfirmStockAdjust = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const updatedStatus: ProductStatus =
            newStock === 0 ? 'OUT_OF_STOCK' : item.status === 'OUT_OF_STOCK' ? 'ACTIVE' : item.status;
          return {
            ...item,
            stockQuantity: newStock,
            status: updatedStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product from the inventory catalog?')) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setOpenDropdownId(null);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected items?`)) {
      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    }
  };

  // Close row dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // --------------------------------------------------------------------------
  // 8. Visual Helpers: Status Badges & Stock Progress Bars
  // --------------------------------------------------------------------------
  const getStatusBadge = (status: ProductStatus, stock: number) => {
    if (stock === 0 || status === 'OUT_OF_STOCK') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
          Out of Stock
        </span>
      );
    }

    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Layers className="w-3 h-3 text-slate-500 shrink-0" />
            Draft
          </span>
        );
      case 'DISCONTINUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
            Discontinued
          </span>
        );
      default:
        return null;
    }
  };

  const getStockProgress = (current: number, reorderPoint: number) => {
    // Dynamic percentage visual calculation
    const maxCapacity = Math.max(reorderPoint * 3, current, 100);
    const percentage = Math.min(100, Math.round((current / maxCapacity) * 100));

    const isLow = current > 0 && current <= reorderPoint;
    const isOut = current === 0;

    const barColor = isOut
      ? 'bg-rose-500'
      : isLow
      ? 'bg-amber-500'
      : 'bg-emerald-500';

    return (
      <div className="w-32 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-bold font-mono ${isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {current.toLocaleString()} units
          </span>
          {isLow && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-tight flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> Low
            </span>
          )}
          {isOut && (
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-tight">
              Empty
            </span>
          )}
        </div>
        <div
          className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden"
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={maxCapacity}
          aria-label={`Stock level: ${current} of estimated capacity`}
        >
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.max(percentage, isOut ? 0 : 6)}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500">
          Reorder threshold: {reorderPoint}
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col font-sans">
      {/* =====================================================================
          1. Header Bar
          ===================================================================== */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Stock Catalog
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
              {totalEntries} {totalEntries === 1 ? 'Product' : 'Products'} Listed
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multi-tenant inventory ledger for <span className="font-semibold text-slate-700 dark:text-slate-300">{organizationName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* CSV Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>

          {/* Accessible Add New Product Primary Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isAddModalOpen}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. Filter Controls Bar
          ===================================================================== */}
      <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Debounced Search Input */}
        <div className="sm:col-span-5 relative">
          <label htmlFor="inventory-search" className="sr-only">
            Search products by SKU, name, or description
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <input
            id="inventory-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search SKU, item name, or specs..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              <span className="sr-only">Clear search</span>
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Dropdown */}
        <div className="sm:col-span-4 flex items-center gap-2">
          <label htmlFor="category-filter" className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Category:
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter Dropdown */}
        <div className="sm:col-span-3 flex items-center gap-2">
          <label htmlFor="stock-status-filter" className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Stock:
          </label>
          <select
            id="stock-status-filter"
            value={selectedStockStatus}
            onChange={(e) => {
              setSelectedStockStatus(e.target.value as StockFilterType);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (&gt; 0)</option>
            <option value="LOW_STOCK">Low Stock (≤ Reorder)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* =====================================================================
          3. Batch Selection Toolbar (Conditional)
          ===================================================================== */}
      {selectedIds.size > 0 && (
        <div className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-950/80 border-b border-indigo-200 dark:border-indigo-900 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <span className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-[11px]">
              {selectedIds.size}
            </span>
            <span>products selected across table</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1 text-xs text-indigo-700 dark:text-indigo-300 hover:underline"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. Accessible Data-Dense Table
          ===================================================================== */}
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse"
          aria-label="Stock Catalog Inventory Management Table"
        >
          <caption className="sr-only">
            Stock Catalog: Comprehensive B2B inventory management ledger displaying SKU, Product, Category, Price, Stock Level, and Status.
          </caption>

          {/* Table Header with proper scope="col" */}
          <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              {/* Batch Checkbox Column */}
              <th scope="col" className="p-3.5 w-10 text-center">
                <span className="sr-only">Select all items on this page</span>
                <input
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                  checked={allCurrentPageSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all products on current page"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
              </th>

              <th scope="col" className="py-3.5 px-3">
                SKU
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[240px]">
                Product Name
              </th>
              <th scope="col" className="py-3.5 px-3">
                Category
              </th>
              <th scope="col" className="py-3.5 px-3 text-right">
                Unit Price
              </th>
              <th scope="col" className="py-3.5 px-3">
                Current Stock &amp; Health
              </th>
              <th scope="col" className="py-3.5 px-3">
                Status
              </th>
              <th scope="col" className="py-3.5 px-3 text-center w-16">
                <span className="sr-only">Actions</span>
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm font-semibold">No products match your active filters.</p>
                  <p className="text-xs mt-1">Try refining your search term or clearing filters.</p>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const isMenuOpen = openDropdownId === product.id;

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelect(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                    </td>

                    {/* SKU with Copy Button */}
                    <td className="py-3.5 px-3 font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 group">
                        <span>{product.sku}</span>
                        <button
                          type="button"
                          onClick={() => handleCopySku(product.sku)}
                          title="Copy SKU to clipboard"
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        >
                          {copiedSku === product.sku ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span className="sr-only">Copy SKU {product.sku}</span>
                        </button>
                      </div>
                    </td>

                    {/* Product Name & Thumbnail */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                          {product.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 hover:text-indigo-600 transition-colors">
                            {product.name}
                          </p>
                          {product.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {product.categoryName ?? 'General'}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                        ${product.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        Cost: ${product.costPrice.toFixed(2)}
                      </div>
                    </td>

                    {/* Current Stock & Low-Stock Progress Bar */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getStockProgress(product.stockQuantity, product.reorderPoint)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getStatusBadge(product.status, product.stockQuantity)}
                    </td>

                    {/* Actions Dropdown */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap" data-dropdown-container>
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(isMenuOpen ? null : product.id);
                          }}
                          aria-haspopup="true"
                          aria-expanded={isMenuOpen}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                          <span className="sr-only">Open actions menu for {product.name}</span>
                        </button>

                        {/* Dropdown Popover */}
                        {isMenuOpen && (
                          <div
                            role="menu"
                            aria-orientation="vertical"
                            className="absolute right-0 mt-1 w-44 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20 focus:outline-none animate-in fade-in duration-100"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenDropdownId(null);
                                setAdjustModalProduct(product);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 flex items-center gap-2"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Adjust Stock</span>
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenDropdownId(null);
                                alert(`Edit product modal for ${product.sku}`);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit Specifications</span>
                            </button>

                            <div className="border-t border-slate-100 dark:border-slate-700/60 my-1" />

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Product</span>
                            </button>
                          </div>
                        )}
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
          5. Accessible Pagination Controls
          ===================================================================== */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        {/* Entries Counter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <label htmlFor="rows-per-page" className="whitespace-nowrap">
              Rows per page:
            </label>
            <select
              id="rows-per-page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <p>
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {totalEntries === 0 ? 0 : (validPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {Math.min(validPage * pageSize, totalEntries)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {totalEntries}
            </span>{' '}
            entries
          </p>
        </div>

        {/* Navigation Buttons */}
        <nav aria-label="Inventory Table Pagination" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={validPage === 1}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <ChevronsLeft className="w-4 h-4" />
            <span className="sr-only">First page</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validPage === 1}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Previous page</span>
          </button>

          <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-300">
            Page {validPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validPage >= totalPages}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Next page</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={validPage >= totalPages}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <ChevronsRight className="w-4 h-4" />
            <span className="sr-only">Last page</span>
          </button>
        </nav>
      </div>

      {/* =====================================================================
          6. Modals (Add Product & Adjust Stock)
          ===================================================================== */}
      <AddProductDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddProduct}
        categories={categories}
      />

      <StockAdjustModal
        product={adjustModalProduct}
        isOpen={Boolean(adjustModalProduct)}
        onClose={() => setAdjustModalProduct(null)}
        onConfirm={handleConfirmStockAdjust}
      />
    </div>
  );
};

export default InventoryDataTable;
