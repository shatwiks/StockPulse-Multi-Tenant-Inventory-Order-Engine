import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order Confirmed | StockPulse B2B Engine',
  description:
    'Order authorized and persisted with pessimistic concurrency lock in StockPulse Inventory Engine.',
}

export default function OrderConfirmedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
