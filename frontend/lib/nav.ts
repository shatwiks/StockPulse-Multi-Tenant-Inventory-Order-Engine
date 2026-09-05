import {
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  key: string
  title: string
  icon: LucideIcon
  badge?: number
}

export const navItems: NavItem[] = [
  { key: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { key: 'inventory', title: 'Inventory', icon: Package, badge: 4 },
  { key: 'orders', title: 'Orders', icon: ShoppingCart, badge: 12 },
  { key: 'analytics', title: 'Analytics', icon: BarChart3 },
  { key: 'settings', title: 'Organization Settings', icon: Settings },
]

export type Tenant = {
  id: string
  name: string
  plan: string
  region: string
  slug?: string
}

export const tenants: Tenant[] = [
  { id: '8fca3ba6-54a5-4985-ac05-2887f056f798', name: 'Acme Retail', plan: 'Enterprise', region: 'US-East', slug: 'acme-retail' },
  { id: 'd4b8e3a2-11c9-482a-9f5e-71649281a0b3', name: 'Summit Supplies', plan: 'Business', region: 'US-West', slug: 'summit-supplies' },
]

export type AppNotification = {
  id: string
  title: string
  description: string
  time: string
  unread: boolean
}

export const notifications: AppNotification[] = [
  {
    id: '1',
    title: 'Low stock alert',
    description: 'SKU-4821 (Hex Bolts M6) dropped below reorder point.',
    time: '5m ago',
    unread: true,
  },
  {
    id: '2',
    title: 'Purchase order approved',
    description: 'PO-10294 for Globex Logistics was approved.',
    time: '1h ago',
    unread: true,
  },
  {
    id: '3',
    title: 'Shipment received',
    description: '320 units received at Warehouse B, Dock 3.',
    time: '3h ago',
    unread: true,
  },
  {
    id: '4',
    title: 'Cycle count complete',
    description: 'Zone A-14 reconciliation finished with 2 variances.',
    time: 'Yesterday',
    unread: false,
  },
]
