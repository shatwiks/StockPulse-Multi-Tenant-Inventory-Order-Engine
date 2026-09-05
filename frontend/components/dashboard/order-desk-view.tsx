'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  CreditCard,
  CheckCircle2,
  Printer,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  ShoppingBag,
  Clock,
  Building2,
  FileText,
  RotateCcw,
} from 'lucide-react'
import {
  products as seedProducts,
  categories,
  categoryLabel,
  categoryImage,
  usd,
  customers,
  TAX_RATE,
  type Product,
  type CategoryKey,
  type Customer,
} from '@/lib/inventory-data'
import { type Tenant } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CartItem {
  product: Product
  quantity: number
}

interface HeldOrder {
  id: string
  timestamp: string
  customer: Customer
  items: CartItem[]
  subtotal: number
}

interface OrderDeskViewProps {
  tenant?: Tenant
}

export function OrderDeskView({ tenant }: OrderDeskViewProps) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [products] = useState<Product[]>(seedProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryKey>('all')
  const [page, setPage] = useState(1)
  const pageSize = 8

  // Cart & POS state
  const [cart, setCart] = useState<CartItem[]>([
    { product: seedProducts[0], quantity: 50 }, // Hex Bolts M6
    { product: seedProducts[3], quantity: 2 },  // Cordless Impact Driver
  ])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0])
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [showHeldModal, setShowHeldModal] = useState(false)
  const [receiptOrder, setReceiptOrder] = useState<{
    orderNumber: string
    timestamp: string
    customer: Customer
    items: CartItem[]
    subtotal: number
    discountAmount: number
    taxAmount: number
    total: number
  } | null>(null)

  // Barcode scanner simulation feedback
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null)

  // --------------------------------------------------------------------------
  // Filtered Catalog
  // --------------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [products, searchQuery, selectedCategory])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  // Reset page when search or category changes
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedCategory])

  // --------------------------------------------------------------------------
  // Cart Calculations
  // --------------------------------------------------------------------------
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100
  }, [subtotal, discountPercent])

  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const taxAmount = taxableAmount * TAX_RATE
  const finalTotal = taxableAmount + taxAmount

  // --------------------------------------------------------------------------
  // Cart Actions
  // --------------------------------------------------------------------------
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter((item): item is CartItem => item !== null)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  // --------------------------------------------------------------------------
  // Barcode Scanner Simulation
  // --------------------------------------------------------------------------
  const handleSimulateScan = () => {
    // Pick a random product from inventory
    const randomIndex = Math.floor(Math.random() * products.length)
    const scannedProduct = products[randomIndex]
    addToCart(scannedProduct)

    setScannedFeedback(`Scanned ${scannedProduct.sku} - ${scannedProduct.name}`)
    setTimeout(() => setScannedFeedback(null), 2500)
  }

  // --------------------------------------------------------------------------
  // Hold & Complete Order Handlers
  // --------------------------------------------------------------------------
  const handleHoldOrder = () => {
    if (cart.length === 0) return

    const newHeld: HeldOrder = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customer: selectedCustomer,
      items: [...cart],
      subtotal,
    }

    setHeldOrders((prev) => [newHeld, ...prev])
    clearCart()
  }

  const handleResumeHeldOrder = (held: HeldOrder) => {
    setCart(held.items)
    setSelectedCustomer(held.customer)
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id))
    setShowHeldModal(false)
  }

  const handleCompleteOrder = () => {
    if (cart.length === 0) return

    const completed = {
      orderNumber: `ORD-POS-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString(),
      customer: selectedCustomer,
      items: [...cart],
      subtotal,
      discountAmount,
      taxAmount,
      total: finalTotal,
    }

    setReceiptOrder(completed)
    clearCart()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Wood-Grain Header for Order Desk POS */}
      <section className="wood-surface relative overflow-hidden rounded-2xl border border-border/70 p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <ShoppingBag className="size-3.5" aria-hidden="true" />
                POS Checkout Station
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Station #04 · {tenant?.name ?? 'Acme Corp'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Order Desk &amp; Quick POS
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              High-speed B2B terminal with live inventory locking, customer account pricing, and instantaneous receipt generation.
            </p>
          </div>

          {/* Held Orders Quick Access Button */}
          {heldOrders.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHeldModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-warning/40 bg-warning/15 text-warning hover:bg-warning/25 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PauseCircle className="size-4" aria-hidden="true" />
              <span>{heldOrders.length} Held {heldOrders.length === 1 ? 'Order' : 'Orders'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Barcode Scanned Toast Notification */}
      {scannedFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/15 px-4 py-2.5 text-xs font-semibold text-success shadow-md animate-in fade-in slide-in-from-top-2"
        >
          <Barcode className="size-4" aria-hidden="true" />
          <span>{scannedFeedback}</span>
        </div>
      )}

      {/* =====================================================================
          Split-Screen Layout: Catalog Grid (Left) + Order Drawer (Right)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* -----------------------------------------------------------------
            LEFT PANEL: Product Catalog Grid (7 Cols on desktop)
            ----------------------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Search & Barcode Scan Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-card/80 p-3 rounded-xl border border-border">
            <div className="relative flex-1">
              <label htmlFor="pos-search" className="sr-only">
                Search product catalog by name or SKU
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="pos-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan or search name / SKU…"
                className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none transition-colors"
              />
            </div>

            {/* Accessible Barcode Scanner Simulation Button */}
            <button
              type="button"
              onClick={handleSimulateScan}
              title="Simulate Barcode Scanner"
              className="inline-flex items-center justify-center size-9 shrink-0 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Barcode className="size-5" aria-hidden="true" />
              <span className="sr-only">Scan barcode (simulation)</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <nav aria-label="POS Catalog Categories" className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              All Items ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedCategory(c.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selectedCategory === c.key
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {c.label}
              </button>
            ))}
          </nav>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {pagedProducts.map((product) => {
              const isOut = product.stock <= 0
              const isLow = product.stock > 0 && product.stock <= product.reorderPoint

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex gap-3">
                    {/* Product Photo */}
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      <Image
                        src={categoryImage[product.category]}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-semibold text-muted-foreground truncate">
                          {product.sku}
                        </span>
                        <span className="inline-flex items-center rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                          {categoryLabel[product.category]}
                        </span>
                      </div>

                      <h3 className="text-xs font-semibold text-foreground line-clamp-1 mt-0.5">
                        {product.name}
                      </h3>

                      <div className="flex items-baseline justify-between mt-2">
                        <span className="text-sm font-bold text-foreground font-mono">
                          {usd(product.price)}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-medium',
                            isOut
                              ? 'text-danger'
                              : isLow
                              ? 'text-warning'
                              : 'text-muted-foreground'
                          )}
                        >
                          {isOut ? 'Out of stock' : `${product.stock} available`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/60">
                    <Button
                      size="sm"
                      disabled={isOut}
                      onClick={() => addToCart(product)}
                      className="w-full gap-1.5 text-xs font-semibold"
                      aria-label={`Add ${product.name} to order`}
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      Add to Order
                    </Button>
                  </div>
                </div>
              )
            })}

            {pagedProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <p className="text-sm font-semibold text-foreground">No catalog items matched.</p>
                <p className="text-xs mt-1">Try modifying your query or category filters.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-3 px-1 text-xs text-muted-foreground">
              <p>
                Showing Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="size-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="size-8 p-0"
                >
                  <ChevronRight className="size-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* -----------------------------------------------------------------
            RIGHT PANEL: Order Summary Drawer (5 Cols on desktop)
            ----------------------------------------------------------------- */}
        <aside
          aria-label="Current Order Summary"
          className="lg:col-span-5 sticky top-20 rounded-2xl border border-border/80 wood-surface p-5 shadow-xl flex flex-col gap-4 text-foreground"
        >
          {/* Header: Customer Selector */}
          <div className="flex flex-col gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[oklch(0.82_0.02_78)] uppercase tracking-wider flex items-center gap-1.5">
                <User className="size-3.5 text-primary" aria-hidden="true" />
                Select Customer Account
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {cart.length} {cart.length === 1 ? 'Line Item' : 'Line Items'}
              </span>
            </div>

            <label htmlFor="pos-customer-select" className="sr-only">
              Customer Account Selector
            </label>
            <select
              id="pos-customer-select"
              value={selectedCustomer.id}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value)
                if (found) setSelectedCustomer(found)
              }}
              className="w-full h-9 px-3 rounded-lg border border-white/20 bg-black/40 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Cart List (Scrollable) */}
          <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                <ShoppingBag className="size-8 opacity-40" aria-hidden="true" />
                <p className="text-xs font-medium text-foreground">Order basket is currently empty.</p>
                <p className="text-[11px]">Click 'Add to Order' on any product card on the left.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-white/10 bg-black/30 backdrop-blur-xs text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{item.product.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{usd(item.product.price)} each</p>
                  </div>

                  {/* Accessible Quantity Selector */}
                  <div className="flex items-center gap-1 shrink-0 bg-black/50 rounded-lg p-0.5 border border-white/15">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      aria-label={`Decrease quantity of ${item.product.name}`}
                      className="size-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-7 text-center font-mono font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      aria-label={`Increase quantity of ${item.product.name}`}
                      className="size-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  {/* Item Subtotal & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-foreground tabular-nums">
                      {usd(item.product.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label={`Remove ${item.product.name} from order`}
                      className="p-1 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Financial Totals Breakdown */}
          <div className="flex flex-col gap-2 pt-3 border-t border-white/10 text-xs text-[oklch(0.82_0.02_78)]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-foreground">{usd(subtotal)}</span>
            </div>

            {/* Discount Input */}
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="pos-discount" className="whitespace-nowrap">
                Discount applied (%):
              </label>
              <div className="flex items-center gap-1.5 w-24">
                <input
                  id="pos-discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  placeholder="0"
                  className="w-full h-7 px-2 text-right rounded border border-white/20 bg-black/40 text-xs font-mono text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <span>%</span>
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="flex items-center justify-between text-success">
                <span>Discount ({discountPercent}%)</span>
                <span className="font-mono font-semibold">-{usd(discountAmount)}</span>
              </div>
            )}

            {/* Tax Calculation (automatic 8.875%) */}
            <div className="flex items-center justify-between">
              <span>Sales Tax (8.875% auto)</span>
              <span className="font-mono font-semibold text-foreground">{usd(taxAmount)}</span>
            </div>

            {/* Final Grand Total in USD */}
            <div className="flex items-baseline justify-between pt-2 border-t border-white/15 text-sm">
              <span className="font-bold text-foreground text-base">Grand Total (USD)</span>
              <span className="font-mono font-extrabold text-2xl text-primary tabular-nums tracking-tight">
                {usd(finalTotal)}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={cart.length === 0}
              onClick={handleHoldOrder}
              className="w-full gap-1.5 text-xs font-semibold border-white/20 hover:bg-white/10 text-foreground"
            >
              <PauseCircle className="size-4" aria-hidden="true" />
              Hold Order
            </Button>

            <Button
              type="button"
              disabled={cart.length === 0}
              onClick={handleCompleteOrder}
              className="w-full gap-1.5 text-xs font-bold shadow-lg"
            >
              <CreditCard className="size-4" aria-hidden="true" />
              Complete Order
            </Button>
          </div>
        </aside>
      </div>

      {/* =====================================================================
          Held Orders Modal
          ===================================================================== */}
      {showHeldModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="held-orders-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <PauseCircle className="size-5 text-warning" />
                <h2 id="held-orders-title" className="text-base font-bold text-foreground">
                  Held Orders Queue ({heldOrders.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowHeldModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
                <span className="sr-only">Close held orders modal</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto">
              {heldOrders.map((held) => (
                <div
                  key={held.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/40 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-foreground">{held.id}</span>
                    <p className="text-muted-foreground mt-0.5">
                      Customer: <span className="font-semibold text-foreground">{held.customer.name}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Time: {held.timestamp} · {held.items.length} items · Total: {usd(held.subtotal * (1 + TAX_RATE))}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleResumeHeldOrder(held)}>
                    Resume
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          Full-Screen Receipt Confirmation Modal Dialog State
          ===================================================================== */}
      {receiptOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-zinc-950 text-slate-100 p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            {/* Header Badge & Brand */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="receipt-title" className="text-xl font-extrabold tracking-tight text-white">
                    Order Payment Confirmed
                  </h2>
                  <p className="text-xs text-zinc-400">
                    StockPulse Multi-Tenant Transaction Receipt · Status: <span className="text-emerald-400 font-semibold">AUTHORIZED</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="size-5" />
                <span className="sr-only">Close receipt dialog</span>
              </button>
            </div>

            {/* Receipt Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs">
              <div>
                <span className="text-zinc-500 block">Order Ref</span>
                <span className="font-mono font-bold text-white">{receiptOrder.orderNumber}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Organization</span>
                <span className="font-semibold text-white">{tenant?.name ?? 'Acme Corp'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Customer</span>
                <span className="font-semibold text-white truncate block">{receiptOrder.customer.name}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Payment Method</span>
                <span className="font-semibold text-emerald-400">B2B Account (NET 30)</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto border border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                  <tr>
                    <th scope="col" className="px-3.5 py-2.5">SKU &amp; Product</th>
                    <th scope="col" className="px-3.5 py-2.5 text-center">Qty</th>
                    <th scope="col" className="px-3.5 py-2.5 text-right">Unit Price</th>
                    <th scope="col" className="px-3.5 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 font-mono">
                  {receiptOrder.items.map((item) => (
                    <tr key={item.product.id} className="text-zinc-200">
                      <td className="px-3.5 py-2.5 font-sans">
                        <span className="font-semibold text-white">{item.product.name}</span>
                        <span className="text-[11px] text-zinc-400 font-mono block">{item.product.sku}</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-bold">{item.quantity}</td>
                      <td className="px-3.5 py-2.5 text-right text-zinc-400">{usd(item.product.price)}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-white">{usd(item.product.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Receipt Summary Breakdown */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs font-mono">
              <div className="flex justify-between text-zinc-400 font-sans">
                <span>Subtotal</span>
                <span className="font-mono text-white">{usd(receiptOrder.subtotal)}</span>
              </div>
              {receiptOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-sans">
                  <span>Discount</span>
                  <span className="font-mono">-{usd(receiptOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400 font-sans">
                <span>Sales Tax (8.875% auto)</span>
                <span className="font-mono text-white">{usd(receiptOrder.taxAmount)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-zinc-800 text-sm font-sans font-bold">
                <span className="text-white text-base">Total Paid</span>
                <span className="font-mono text-2xl text-emerald-400">{usd(receiptOrder.total)}</span>
              </div>
            </div>

            {/* Receipt Modal Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs text-zinc-200 border-zinc-700 hover:bg-zinc-800"
                >
                  <Printer className="size-4" />
                  Print Receipt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Receipt ${receiptOrder.orderNumber} exported to PDF.`)}
                  className="gap-1.5 text-xs text-zinc-200 border-zinc-700 hover:bg-zinc-800"
                >
                  <Download className="size-4" />
                  Download PDF
                </Button>
              </div>

              <Button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="w-full sm:w-auto gap-1.5 text-xs font-bold"
              >
                <RotateCcw className="size-4" />
                Start New Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDeskView
