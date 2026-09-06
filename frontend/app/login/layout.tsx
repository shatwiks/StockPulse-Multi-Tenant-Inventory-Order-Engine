import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | StockPulse Enterprise B2B Engine',
  description:
    'Secure operator and administrator portal for StockPulse Multi-Tenant Inventory & POS Order Engine.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
