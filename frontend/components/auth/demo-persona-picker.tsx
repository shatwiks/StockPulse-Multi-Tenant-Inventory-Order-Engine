'use client'

import React from 'react'
import { ShieldCheck, UserCheck, KeyRound, Building2, Zap, ArrowRight } from 'lucide-react'
import type { UserRole } from '@/lib/auth-context'

export interface DemoPersona {
  role: UserRole
  name: string
  email: string
  tenantName: string
  tenantSlug: string
  description: string
  badgeColor: string
  borderColor: string
  icon: React.ComponentType<{ className?: string }>
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: 'ADMIN',
    name: 'Aarav Sharma',
    email: 'admin@bharat-retail.in',
    tenantName: 'Bharat Logistics & Retail',
    tenantSlug: 'bharat-retail',
    description: 'Full CRUD, Multi-Warehouse, RBAC & Organization Settings',
    badgeColor: 'bg-rose-500/20 text-rose-200',
    borderColor: 'hover:border-rose-500/50',
    icon: ShieldCheck,
  },
  {
    role: 'MANAGER',
    name: 'Bob Miller',
    email: 'manager@bharat-retail.in',
    tenantName: 'Bharat Logistics & Retail',
    tenantSlug: 'bharat-retail',
    description: 'Inventory Management, Bulk Reorder & Stock Reconciliation',
    badgeColor: 'bg-amber-500/20 text-amber-200',
    borderColor: 'hover:border-amber-500/50',
    icon: UserCheck,
  },
  {
    role: 'CASHIER',
    name: 'Charlie Davis',
    email: 'cashier@bharat-retail.in',
    tenantName: 'Bharat Logistics & Retail',
    tenantSlug: 'bharat-retail',
    description: 'High-Concurrency POS Terminal & Real-Time Checkout',
    badgeColor: 'bg-amber-600/20 text-amber-200',
    borderColor: 'hover:border-amber-500/50',
    icon: KeyRound,
  },
  {
    role: 'ADMIN',
    name: 'Suresh Reddy',
    email: 'admin@deccan-supplies.in',
    tenantName: 'Deccan Supply Chain',
    tenantSlug: 'deccan-supplies',
    description: 'Multi-Tenant Isolation Showcase (Secondary Org)',
    badgeColor: 'bg-orange-500/20 text-orange-200',
    borderColor: 'hover:border-orange-500/50',
    icon: Building2,
  },
]

interface DemoPersonaPickerProps {
  onSelectPersona: (persona: DemoPersona) => void
  disabled?: boolean
  selectedEmail?: string
}

export function DemoPersonaPicker({
  onSelectPersona,
  disabled = false,
  selectedEmail,
}: DemoPersonaPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-3.5 text-[#FBBF24]" />
          <span className="text-xs font-bold text-amber-100/90 font-sans tracking-wide">
            Instant 1-Click Demo Evaluation
          </span>
        </div>
        <span className="text-xs text-stone-400 font-sans">Pre-seeded RBAC</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {DEMO_PERSONAS.map((persona) => {
          const Icon = persona.icon
          const isSelected = selectedEmail === persona.email

          return (
            <button
              key={`${persona.tenantSlug}-${persona.email}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPersona(persona)}
              className={`group relative flex flex-col items-start text-left p-3 rounded-xl border transition-all duration-200 outline-none
                ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/70 shadow-md shadow-black/40 ring-1 ring-amber-500/50'
                    : 'bg-[#1F1A17] hover:bg-[#2B2118] border-white/10 ' + persona.borderColor
                }
                focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase ${persona.badgeColor}`}
                  >
                    <Icon className="size-3" />
                    <span>{persona.role}</span>
                  </span>
                  <span className="text-xs font-semibold text-[#F3E8E2] truncate">
                    {persona.name}
                  </span>
                </div>
                <ArrowRight className="size-3.5 text-stone-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FBBF24]" />
              </div>

              <span className="text-xs text-amber-200/90 font-mono truncate w-full mb-0.5">
                {persona.email}
              </span>

              <span className="text-xs text-stone-200 line-clamp-1 font-sans">
                {persona.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
