'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, ArrowLeft, Printer, Download, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import { BrandLockup } from '@/components/auth/brand-lockup'

function OrderConfirmedContent() {
  const searchParams = useSearchParams()
  const orderRef = searchParams.get('ref') || 'ORD-2026-98421'
  const tenantName = searchParams.get('tenant') || 'Bharat Logistics & Retail'

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/10 mb-2">
          <CheckCircle2 className="size-9" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#F3E8E2] tracking-tight">
          Order Confirmed &amp; Dispatched
        </h1>
        <p className="text-sm text-stone-300">
          Your wholesale order has been authorized with pessimistic inventory allocation and logged to tenant partition.
        </p>
      </div>

      {/* Card Details */}
      <div className="rounded-2xl bg-[#1F1A17] border border-[#2B2118] p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2B2118] pb-4">
          <div>
            <span className="text-xs text-stone-300 uppercase tracking-wider block">Order Reference</span>
            <span className="font-mono text-base font-bold text-amber-400">{orderRef}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-300 uppercase tracking-wider block">Partition Hub</span>
            <span className="text-xs font-semibold text-stone-200">{tenantName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#2B2118]/60 border border-white/5 space-y-1">
            <span className="text-stone-300 flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-amber-400" />
              Lock Guarantee
            </span>
            <span className="font-semibold text-stone-200 block">Pessimistic Row Lock</span>
          </div>
          <div className="p-3 rounded-xl bg-[#2B2118]/60 border border-white/5 space-y-1">
            <span className="text-stone-300 flex items-center gap-1">
              <Truck className="size-3.5 text-amber-400" />
              Dispatch Target
            </span>
            <span className="font-semibold text-stone-200 block">Express Next-Day</span>
          </div>
          <div className="p-3 rounded-xl bg-[#2B2118]/60 border border-white/5 space-y-1">
            <span className="text-stone-300 flex items-center gap-1">
              <ShoppingBag className="size-3.5 text-amber-400" />
              Tax Settlement
            </span>
            <span className="font-semibold text-emerald-400 block">18% GST Compliant</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-[#2B2118] hover:bg-white/10 text-stone-200 font-semibold text-xs transition-all"
          >
            <Printer className="size-4" />
            <span>Print Tax Invoice</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#171310] font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <ArrowLeft className="size-4" />
            <span>Return to Console</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmedPage() {
  return (
    <div className="min-h-screen bg-[#171310] text-[#F3E8E2] flex flex-col justify-between p-6 sm:p-12 font-sans">
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <BrandLockup size="sm" showTagline={true} />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
        >
          <ArrowLeft className="size-4" />
          <span>Console</span>
        </Link>
      </header>

      <Suspense fallback={<div className="text-center text-stone-400 text-sm">Loading order details...</div>}>
        <OrderConfirmedContent />
      </Suspense>

      <footer className="max-w-2xl mx-auto w-full pt-8 mt-8 border-t border-white/5 text-center text-xs text-stone-300">
        StockPulse Multi-Tenant Distributed POS &amp; Inventory Engine · BKC Logistics Hub Mumbai
      </footer>
    </div>
  )
}
