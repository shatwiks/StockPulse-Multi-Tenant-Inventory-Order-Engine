import React from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, ArrowLeft, Terminal, Shield } from 'lucide-react'
import { BrandLockup } from '@/components/auth/brand-lockup'

export const metadata = {
  title: '404: Partition Not Found — StockPulse Engine',
  description: 'The requested resource or tenant partition could not be located in the StockPulse cluster.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#171310] text-[#F3E8E2] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header Lockup */}
      <header className="w-full flex items-center justify-between border-b border-white/10 pb-6">
        <BrandLockup size="sm" showTagline={true} />
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300">
          <Terminal className="size-3.5" />
          <span>ERR_404_ROUTE_UNRESOLVED</span>
        </div>
      </header>

      {/* Main Error Hero */}
      <main className="max-w-2xl mx-auto my-auto text-center flex flex-col items-center py-12">
        <div className="size-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#FBBF24] mb-6 shadow-xl shadow-black/60">
          <AlertTriangle className="size-10" />
        </div>

        <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase mb-2">
          HTTP 404 — Multi-Tenant Scope Out of Bounds
        </span>

        <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#F3E8E2] mb-4">
          Route or Partition Not Found
        </h1>

        <p className="text-sm sm:text-base text-stone-300 max-w-lg leading-relaxed mb-8">
          The requested URL does not map to an active warehouse pod, order desk terminal, or API schema within this organization tenant.
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#171310] font-bold text-sm shadow-lg shadow-black/50 transition-all active:scale-[0.98]"
          >
            <Home className="size-4" />
            <span>Return to Operations Hub</span>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1F1A17] hover:bg-[#2B2118] border border-white/15 text-stone-200 font-medium text-sm transition-all"
          >
            <ArrowLeft className="size-4" />
            <span>Switch Tenant Persona</span>
          </Link>
        </div>

        {/* Telemetry Debug Badge */}
        <div className="mt-12 p-4 rounded-xl bg-[#1F1A17] border border-white/10 text-left max-w-md w-full font-mono text-xs text-stone-400">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-stone-300 font-sans font-semibold">
            <span className="flex items-center gap-1.5">
              <Shield className="size-3.5 text-amber-400" />
              Tenant Boundary Audit
            </span>
            <span className="text-emerald-400 text-[10px]">ENFORCED</span>
          </div>
          <p>Cluster: AP-South-1 (Mumbai)</p>
          <p>Isolation: Row-Level PostgreSQL Partition</p>
          <p>Action: Safely aborting navigation to prevent tenant leakage</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center border-t border-white/10 pt-6 text-xs text-stone-400 font-sans">
        StockPulse Engine &copy; 2026 Bharat Logistics &amp; Deccan Supply Chain. All rights reserved.
      </footer>
    </div>
  )
}
