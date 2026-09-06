export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export type CategoryKey =
  | 'fasteners'
  | 'power-tools'
  | 'safety'
  | 'electrical'
  | 'adhesives'
  | 'fluids'
  | 'electronics'
  | 'hardware'
  | 'general'

export type Category = {
  id?: string
  key: CategoryKey
  label: string
  image: string
}

export const categories: Category[] = [
  { key: 'fasteners', label: 'Fasteners', image: '/products/fasteners.png' },
  { key: 'power-tools', label: 'Power Tools', image: '/products/power-tools.png' },
  { key: 'safety', label: 'Safety', image: '/products/safety.png' },
  { key: 'electrical', label: 'Electrical', image: '/products/electrical.png' },
  { key: 'adhesives', label: 'Adhesives', image: '/products/adhesives.png' },
  { key: 'fluids', label: 'Fluids', image: '/products/fluids.png' },
  { key: 'electronics', label: 'Consumer Electronics', image: '/products/electrical.png' },
  { key: 'hardware', label: 'Heavy Hardware', image: '/products/fasteners.png' },
]

export const categoryLabel: Record<string, string> = Object.fromEntries([
  ...categories.map((c) => [c.key, c.label]),
  ['Consumer Electronics', 'Electronics'],
  ['Commercial Hardware', 'Hardware'],
  ['Safety Equipment', 'Safety'],
  ['Heavy Machinery Tools', 'Power Tools'],
])

export const categoryImage: Record<string, string> = Object.fromEntries([
  ...categories.map((c) => [c.key, c.image]),
  ['Consumer Electronics', '/products/electrical.png'],
  ['Commercial Hardware', '/products/fasteners.png'],
  ['Safety Equipment', '/products/safety.png'],
  ['Heavy Machinery Tools', '/products/power-tools.png'],
])

/**
 * Smart category image resolver.
 * Handles tenant-prefixed slugs from the API (e.g. "bharat-electronics", "deccan-safety")
 * by pattern-matching against known image keywords.
 */
const imageKeywords: [string, string][] = [
  ['electronic', '/products/electrical.png'],
  ['pos', '/products/electrical.png'],
  ['safety', '/products/safety.png'],
  ['protective', '/products/safety.png'],
  ['logistics', '/products/power-tools.png'],
  ['warehouse', '/products/power-tools.png'],
  ['pantry', '/products/fluids.png'],
  ['coffee', '/products/fluids.png'],
  ['essential', '/products/fluids.png'],
  ['hardware', '/products/fasteners.png'],
  ['fastener', '/products/fasteners.png'],
  ['bolt', '/products/fasteners.png'],
  ['adhesive', '/products/adhesives.png'],
  ['power-tool', '/products/power-tools.png'],
  ['tool', '/products/power-tools.png'],
  ['fluid', '/products/fluids.png'],
  ['electrical', '/products/electrical.png'],
]

export function getCategoryImage(categoryKey: string, categoryName?: string): string {
  // 1. Direct lookup
  if (categoryImage[categoryKey]) return categoryImage[categoryKey]

  // 2. Fuzzy keyword match against slug + name
  const haystack = `${categoryKey} ${categoryName || ''}`.toLowerCase()
  for (const [keyword, image] of imageKeywords) {
    if (haystack.includes(keyword)) return image
  }

  // 3. Fallback
  return '/products/electrical.png'
}

export interface Product {
  id: string
  organizationId?: string
  categoryId?: string
  sku: string
  name: string
  description?: string
  category: CategoryKey | string
  categoryName?: string
  price: number
  unitPrice: number
  costPrice?: number
  stock: number
  stockQuantity: number
  reorderPoint: number
  reorderLevel: number
  status?: string
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  categoryObj?: {
    id: string
    name: string
    slug?: string
  } | null
}

export function normalizeProduct(p: any): Product {
  const stock = typeof p.stockQuantity === 'number' ? p.stockQuantity : (p.stock ?? 0)
  const reorderPoint = typeof p.reorderLevel === 'number' ? p.reorderLevel : (p.reorderPoint ?? 10)

  // Prisma Decimal fields serialize as STRINGS over JSON (e.g. "2499.00" not 2499).
  // parseFloat handles both string and number inputs correctly.
  const rawPrice = p.unitPrice ?? p.price ?? 0
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice) || 0

  const rawCost = p.costPrice
  const costPrice = rawCost != null ? (typeof rawCost === 'number' ? rawCost : parseFloat(rawCost) || 0) : undefined

  const categoryName = p.category?.name || p.category || 'General'

  return {
    id: p.id,
    organizationId: p.organizationId,
    categoryId: p.categoryId,
    sku: p.sku || 'SKU-000',
    name: p.name || 'Unnamed Product',
    description: p.description ?? '',
    category: (p.categoryKey || p.category?.slug || categoryName.toLowerCase().replace(/\s+/g, '-')) as CategoryKey,
    categoryName: categoryName,
    price: price,
    unitPrice: price,
    costPrice: costPrice,
    stock: stock,
    stockQuantity: stock,
    reorderPoint: reorderPoint,
    reorderLevel: reorderPoint,
    status: p.status ?? 'ACTIVE',
    stockStatus: p.stockStatus ?? (stock <= 0 ? 'OUT_OF_STOCK' : stock <= reorderPoint ? 'LOW_STOCK' : 'IN_STOCK'),
    categoryObj: p.category,
  }
}

export function statusOf(product: Product): StockStatus {
  const stock = product.stockQuantity ?? product.stock ?? 0
  const reorder = product.reorderLevel ?? product.reorderPoint ?? 10
  if (stock <= 0) return 'out-of-stock'
  if (stock <= reorder) return 'low-stock'
  return 'in-stock'
}

export const statusMeta: Record<
  StockStatus,
  { label: string; short: string }
> = {
  'in-stock': { label: 'In Stock', short: 'OK' },
  'low-stock': { label: 'Low Stock', short: 'Low' },
  'out-of-stock': { label: 'Out of Stock', short: 'Out' },
}

export const products: Product[] = [
  { id: 'p1', sku: 'BHT-SAF-1001', name: 'Heavy-Duty Industrial Safety Boots', category: 'safety', price: 2499.0, unitPrice: 2499.0, stock: 45, stockQuantity: 45, reorderPoint: 10, reorderLevel: 10 },
  { id: 'p2', sku: 'BHT-ELC-1002', name: 'Fast-Charging Power Hub (65W)', category: 'electronics', price: 3999.0, unitPrice: 3999.0, stock: 80, stockQuantity: 80, reorderPoint: 15, reorderLevel: 15 },
  { id: 'p3', sku: 'BHT-LOG-2001', name: 'Ergonomic Warehouse Apron', category: 'hardware', price: 1499.0, unitPrice: 1499.0, stock: 4, stockQuantity: 4, reorderPoint: 10, reorderLevel: 10 },
  { id: 'p4', sku: 'BHT-PAN-3001', name: 'Coorg Single-Estate Arabica Coffee (1kg)', category: 'general', price: 1850.0, unitPrice: 1850.0, stock: 5, stockQuantity: 5, reorderPoint: 12, reorderLevel: 12 },
  { id: 'p5', sku: 'BHT-ELC-1003', name: 'Thermal Billing Printer', category: 'electronics', price: 12499.0, unitPrice: 12499.0, stock: 0, stockQuantity: 0, reorderPoint: 8, reorderLevel: 8 },
  { id: 'p6', sku: 'BHT-LOG-2002', name: 'High-Visibility Safety Vest (Class 3)', category: 'safety', price: 799.0, unitPrice: 799.0, stock: 0, stockQuantity: 0, reorderPoint: 20, reorderLevel: 20 },
  { id: 'p7', sku: 'DEC-HDW-4001', name: 'Galvanized Hex Bolt Assortment (Pack of 150)', category: 'fasteners', price: 3499.0, unitPrice: 3499.0, stock: 120, stockQuantity: 120, reorderPoint: 25, reorderLevel: 25 },
  { id: 'p8', sku: 'DEC-SAF-5001', name: 'Polycarbonate Protective Safety Goggles', category: 'safety', price: 899.0, unitPrice: 899.0, stock: 65, stockQuantity: 65, reorderPoint: 15, reorderLevel: 15 },
  { id: 'p9', sku: 'DEC-SAF-5002', name: 'Dual-Cartridge Chemical Respirator', category: 'safety', price: 4299.0, unitPrice: 4299.0, stock: 3, stockQuantity: 3, reorderPoint: 10, reorderLevel: 10 },
  { id: 'p10', sku: 'DEC-HDW-4002', name: 'Pneumatic Framing Coil Nailer (Industrial)', category: 'power-tools', price: 18999.0, unitPrice: 18999.0, stock: 0, stockQuantity: 0, reorderPoint: 5, reorderLevel: 5 },
  { id: 'p11', sku: 'ELE-CU-100', name: 'Industrial Copper Cable Spool (100m)', category: 'electrical', price: 6850.0, unitPrice: 6850.0, stock: 42, stockQuantity: 42, reorderPoint: 15, reorderLevel: 15 },
  { id: 'p12', sku: 'ELE-MCB-32', name: 'Three-Phase Miniature Circuit Breaker (32A)', category: 'electrical', price: 2150.0, unitPrice: 2150.0, stock: 28, stockQuantity: 28, reorderPoint: 10, reorderLevel: 10 },
]

export function formatCurrency(amount: number | string | null | undefined): string {
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(numericValue)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export const inr = (value: number | string | null | undefined) => formatCurrency(value);
export const usd = formatCurrency; // backward compatibility for all existing dashboard views

const numberFormatter = new Intl.NumberFormat('en-IN');
export const compactNumber = (value: number) => numberFormatter.format(value);

export type Customer = { id: string; name: string; type: string; email?: string };

export const customers: Customer[] = [
  { id: 'walk-in', name: 'Walk-in Retail Buyer', email: 'walkin@retail.in', type: 'Retail' },
  { id: 'bharat-field', name: 'Bharat Logistics Depot #4', email: 'depot4@bharat-retail.in', type: 'Internal' },
  { id: 'tata-proj', name: 'Tata Projects Infrastructure', email: 'procurement@tataprojects.in', type: 'Corporate' },
  { id: 'lt-eng', name: 'Larsen & Toubro Site Ops', email: 'siteops@larsentoubro.in', type: 'Enterprise' },
];

export const TAX_RATE = 0.18; // Standard 18% GST (9% CGST + 9% SGST)
