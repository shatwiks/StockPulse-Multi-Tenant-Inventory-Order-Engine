import React from 'react'
import Link from 'next/link'
import { FileText, ArrowLeft, CheckCircle2, ShieldAlert, Cpu, Scale } from 'lucide-react'
import { BrandLockup } from '@/components/auth/brand-lockup'

export const metadata = {
  title: 'Enterprise Terms of Service & SLAs — StockPulse Engine',
  description: 'Enterprise terms of service, SLA guarantees, and concurrency commitments for StockPulse.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#171310] text-[#F3E8E2] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <BrandLockup size="sm" showTagline={true} />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Console</span>
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto w-full flex-1 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 mb-3">
            <FileText className="size-3.5" />
            <span>Master Enterprise Subscription Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#F3E8E2]">
            Terms of Service &amp; SLA Commitments
          </h1>
          <p className="text-sm text-stone-400 mt-2">
            Effective Date: September 6, 2026 • Contract Tier: Enterprise B2B
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
            <CheckCircle2 className="size-5 text-[#F59E0B]" />
            1. 99.99% High Availability Service Level Agreement (SLA)
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            StockPulse provides an enterprise availability commitment of 99.99% uptime across all automated warehouse clusters and POS checkout endpoints. Maintenance windows are scheduled during off-peak hours with automated replication failover.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
            <Cpu className="size-5 text-[#F59E0B]" />
            2. Pessimistic Concurrency &amp; Zero-Oversell Guarantee
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            All order checkout requests execute inside atomic transactions using ordered row-level locks (<code className="bg-[#1F1A17] px-1.5 py-0.5 rounded border border-white/10 text-amber-300 font-mono text-xs">SELECT ... FOR UPDATE ORDER BY id ASC</code>). Under condition of concurrent stock depletion, StockPulse guarantees zero negative stock drift and returns structured <code className="bg-[#1F1A17] px-1.5 py-0.5 rounded border border-white/10 text-rose-300 font-mono text-xs">HTTP 409 Conflict</code> shortage payloads.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
            <Scale className="size-5 text-[#F59E0B]" />
            3. Statutory Indian GST Compliance
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            The platform calculates and records statutory Goods and Services Tax (18% GST split into 9% CGST and 9% SGST) on completed point-of-sale checkouts. Operators remain responsible for statutory tax remittances to state and central tax authorities.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
            <ShieldAlert className="size-5 text-[#F59E0B]" />
            4. Principle of Least Privilege &amp; Access Controls
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            Tenants must assign roles according to the Principle of Least Privilege. Actions performed under assigned personnel credentials (Admin, Manager, Cashier) are logged with immutable cryptographic audit trails.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center border-t border-white/10 pt-6 mt-12 text-xs text-stone-400">
        StockPulse Engine &copy; 2026 Bharat Logistics &amp; Deccan Supply Chain. All rights reserved.
      </footer>
    </div>
  )
}
