import React from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Lock, Database, EyeOff, Server } from 'lucide-react'
import { BrandLockup } from '@/components/auth/brand-lockup'

export const metadata = {
  title: 'Privacy & Data Isolation Policy — StockPulse Engine',
  description: 'Enterprise privacy specifications, row-level tenant partitioning, and data isolation guarantees for StockPulse.',
}

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="size-3.5" />
            <span>DPDP Act (India) &amp; Enterprise Multi-Tenant Security Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#F3E8E2]">
            Privacy &amp; Data Isolation Policy
          </h1>
          <p className="text-sm text-stone-400 mt-2">
            Last Updated: September 6, 2026 • Version 2.4.0
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
            <Database className="size-5 text-[#F59E0B]" />
            1. Zero-Trust Multi-Tenant Database Isolation
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            StockPulse operates on a multi-tenant relational architecture backed by PostgreSQL 16. Every query, mutation, and read operation is strictly scoped by the organization UUID (<code className="bg-[#1F1A17] px-1.5 py-0.5 rounded border border-white/10 text-amber-300 font-mono text-xs">organizationId</code>). Cross-tenant queries are rejected at both application middleware and database storage engine constraints.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
            <Lock className="size-5 text-[#F59E0B]" />
            2. Data Collection &amp; Operational Usage
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            We collect strictly the operational data necessary to perform point-of-sale checkout, inventory reconciliation, and statutory GST taxation invoicing:
          </p>
          <ul className="list-disc list-inside text-sm text-stone-300 space-y-1.5 pl-2">
            <li><strong>Personnel Credentials:</strong> Business email addresses, hashed salted passwords, and RBAC role assignments.</li>
            <li><strong>Inventory Catalog:</strong> SKUs, stock counts, cost pricing, taxonomic categories, and reorder alerts.</li>
            <li><strong>Transaction Records:</strong> Order UUIDs, timestamps, line-item quantities, and 18% GST tax ledger entries.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
            <Server className="size-5 text-[#F59E0B]" />
            3. Regional Cloud Sovereignty &amp; Encryption
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            All tenant data resides in the <code className="bg-[#1F1A17] px-1.5 py-0.5 rounded border border-white/10 text-amber-300 font-mono text-xs">AP-South-1 (Mumbai, India)</code> cloud region. Data in transit is protected using TLS 1.3 encryption, and data at rest utilizes AES-256 block cipher encryption.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2">
            <EyeOff className="size-5 text-[#F59E0B]" />
            4. No Advertising &amp; Non-Disclosure
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            StockPulse does not sell, license, or monetize customer inventory data, customer lists, or transaction metrics to any third parties or advertising networks.
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
