'use client'

import { useAuth } from '@/lib/auth-context'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { LoginPageView } from '@/components/auth/login-page-view'
import { Loader2 } from 'lucide-react'

export default function Page() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#171310] flex flex-col items-center justify-center text-foreground gap-4 font-mono">
        <Loader2 className="size-8 text-[#FBBF24] animate-spin" />
        <span className="text-xs text-amber-200/70 tracking-wider uppercase">
          Initializing StockPulse Telemetry...
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPageView />
  }

  return <DashboardShell />
}

