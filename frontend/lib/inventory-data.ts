export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export type CategoryKey =
  | 'fasteners'
  | 'power-tools'
  | 'safety'
  | 'electrical'
  | 'adhesives'
  | 'fluids'

export type Category = {
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
]

export const categoryLabel: Record<CategoryKey, string> = Object.fromEntries(
  categories.map((c) => [c.key, c.label]),
) as Record<CategoryKey, string>

export const categoryImage: Record<CategoryKey, string> = Object.fromEntries(
  categories.map((c) => [c.key, c.image]),
) as Record<CategoryKey, string>

export type Product = {
  id: string
  sku: string
  name: string
  category: CategoryKey
  price: number
  stock: number
  reorderPoint: number
}

export function statusOf(product: Product): StockStatus {
  if (product.stock <= 0) return 'out-of-stock'
  if (product.stock <= product.reorderPoint) return 'low-stock'
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
  { id: 'p1', sku: 'HEX-M6-40', name: 'Hex Bolts M6 x 40mm', category: 'fasteners', price: 0.42, stock: 4820, reorderPoint: 1000 },
  { id: 'p2', sku: 'WSH-M8-SS', name: 'Stainless Washers M8', category: 'fasteners', price: 0.12, stock: 240, reorderPoint: 800 },
  { id: 'p3', sku: 'ANC-050-CS', name: 'Anchor Bolts 1/2 in', category: 'fasteners', price: 1.85, stock: 0, reorderPoint: 300 },
  { id: 'p4', sku: 'PWR-IMP-18', name: 'Cordless Impact Driver 18V', category: 'power-tools', price: 149.0, stock: 62, reorderPoint: 20 },
  { id: 'p5', sku: 'PWR-GR-900', name: 'Angle Grinder 900W', category: 'power-tools', price: 89.5, stock: 14, reorderPoint: 15 },
  { id: 'p6', sku: 'PWR-RH-26', name: 'Rotary Hammer Drill 26mm', category: 'power-tools', price: 210.0, stock: 8, reorderPoint: 10 },
  { id: 'p7', sku: 'SAF-GOG-01', name: 'Safety Goggles Pro', category: 'safety', price: 12.75, stock: 530, reorderPoint: 150 },
  { id: 'p8', sku: 'SAF-GLV-100', name: 'Nitrile Gloves (Box / 100)', category: 'safety', price: 18.4, stock: 96, reorderPoint: 120 },
  { id: 'p9', sku: 'ELE-CU-12', name: 'Copper Wire Spool 12AWG', category: 'electrical', price: 74.0, stock: 210, reorderPoint: 60 },
  { id: 'p10', sku: 'ELE-CB-20', name: 'Circuit Breaker 20A', category: 'electrical', price: 22.3, stock: 0, reorderPoint: 40 },
  { id: 'p11', sku: 'ADH-EPX-2', name: 'Industrial Epoxy 2-Part', category: 'adhesives', price: 15.6, stock: 340, reorderPoint: 100 },
  { id: 'p12', sku: 'ADH-PTFE', name: 'Thread Sealant Tape', category: 'adhesives', price: 3.2, stock: 58, reorderPoint: 80 },
  { id: 'p13', sku: 'FLU-HYD-5', name: 'Hydraulic Oil 5L', category: 'fluids', price: 41.0, stock: 128, reorderPoint: 40 },
  { id: 'p14', sku: 'FLU-CUT-1', name: 'Cutting Fluid Concentrate', category: 'fluids', price: 28.75, stock: 12, reorderPoint: 25 },
]

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const usd = (value: number) => usdFormatter.format(value)

const numberFormatter = new Intl.NumberFormat('en-US')
export const compactNumber = (value: number) => numberFormatter.format(value)

export type Customer = { id: string; name: string; type: string }

export const customers: Customer[] = [
  { id: 'walk-in', name: 'Walk-in Customer', type: 'Retail' },
  { id: 'acme-field', name: 'Acme Field Crew', type: 'Internal' },
  { id: 'bldrs', name: 'Builders United LLC', type: 'Wholesale' },
  { id: 'metro', name: 'Metro Maintenance Dept.', type: 'Contract' },
]

export const TAX_RATE = 0.08875
