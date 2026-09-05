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
  const price = typeof p.unitPrice === 'number' ? p.unitPrice : (p.price ?? 0)
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
    costPrice: p.costPrice ?? undefined,
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
  { id: 'p1', sku: 'HEX-M6-40', name: 'Hex Bolts M6 x 40mm', category: 'fasteners', price: 0.42, unitPrice: 0.42, stock: 4820, stockQuantity: 4820, reorderPoint: 1000, reorderLevel: 1000 },
  { id: 'p2', sku: 'WSH-M8-SS', name: 'Stainless Washers M8', category: 'fasteners', price: 0.12, unitPrice: 0.12, stock: 240, stockQuantity: 240, reorderPoint: 800, reorderLevel: 800 },
  { id: 'p3', sku: 'ANC-050-CS', name: 'Anchor Bolts 1/2 in', category: 'fasteners', price: 1.85, unitPrice: 1.85, stock: 0, stockQuantity: 0, reorderPoint: 300, reorderLevel: 300 },
  { id: 'p4', sku: 'PWR-IMP-18', name: 'Cordless Impact Driver 18V', category: 'power-tools', price: 149.0, unitPrice: 149.0, stock: 62, stockQuantity: 62, reorderPoint: 20, reorderLevel: 20 },
  { id: 'p5', sku: 'PWR-GR-900', name: 'Angle Grinder 900W', category: 'power-tools', price: 89.5, unitPrice: 89.5, stock: 14, stockQuantity: 14, reorderPoint: 15, reorderLevel: 15 },
  { id: 'p6', sku: 'PWR-RH-26', name: 'Rotary Hammer Drill 26mm', category: 'power-tools', price: 210.0, unitPrice: 210.0, stock: 8, stockQuantity: 8, reorderPoint: 10, reorderLevel: 10 },
  { id: 'p7', sku: 'SAF-GOG-01', name: 'Safety Goggles Pro', category: 'safety', price: 12.75, unitPrice: 12.75, stock: 530, stockQuantity: 530, reorderPoint: 150, reorderLevel: 150 },
  { id: 'p8', sku: 'SAF-GLV-100', name: 'Nitrile Gloves (Box / 100)', category: 'safety', price: 18.4, unitPrice: 18.4, stock: 96, stockQuantity: 96, reorderPoint: 120, reorderLevel: 120 },
  { id: 'p9', sku: 'ELE-CU-12', name: 'Copper Wire Spool 12AWG', category: 'electrical', price: 74.0, unitPrice: 74.0, stock: 210, stockQuantity: 210, reorderPoint: 60, reorderLevel: 60 },
  { id: 'p10', sku: 'ELE-CB-20', name: 'Circuit Breaker 20A', category: 'electrical', price: 22.3, unitPrice: 22.3, stock: 0, stockQuantity: 0, reorderPoint: 40, reorderLevel: 40 },
  { id: 'p11', sku: 'ADH-EPX-2', name: 'Industrial Epoxy 2-Part', category: 'adhesives', price: 15.6, unitPrice: 15.6, stock: 340, stockQuantity: 340, reorderPoint: 100, reorderLevel: 100 },
  { id: 'p12', sku: 'ADH-PTFE', name: 'Thread Sealant Tape', category: 'adhesives', price: 3.2, unitPrice: 3.2, stock: 58, stockQuantity: 58, reorderPoint: 80, reorderLevel: 80 },
  { id: 'p13', sku: 'FLU-HYD-5', name: 'Hydraulic Oil 5L', category: 'fluids', price: 41.0, unitPrice: 41.0, stock: 128, stockQuantity: 128, reorderPoint: 40, reorderLevel: 40 },
  { id: 'p14', sku: 'FLU-CUT-1', name: 'Cutting Fluid Concentrate', category: 'fluids', price: 28.75, unitPrice: 28.75, stock: 12, stockQuantity: 12, reorderPoint: 25, reorderLevel: 25 },
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
