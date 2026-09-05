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
}

export const tenants: Tenant[] = [
  { id: 'acme', name: 'Acme Corp', plan: 'Enterprise', region: 'US-East' },
  { id: 'globex', name: 'Globex Logistics', plan: 'Business', region: 'EU-West' },
  { id: 'initech', name: 'Initech Supply Co.', plan: 'Business', region: 'US-West' },
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
