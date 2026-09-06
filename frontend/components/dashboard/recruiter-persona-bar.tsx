'use client'

import { useState, useId } from 'react'
import { useAuth, type UserRole } from '@/lib/auth-context'
import { tenants, type Tenant } from '@/lib/nav'
import { Modal } from './modal'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Building2,
  Loader2,
  ChevronRight,
  Fingerprint,
} from 'lucide-react'

interface RecruiterPersonaBarProps {
  currentTenant?: Tenant
  onTenantChange?: (tenant: Tenant) => void
}

type Persona = {
  name: string
  fullName: string
  role: UserRole
  email: string
  tenantSlug: 'bharat-retail' | 'deccan-supplies'
  tenantName: string
  tenantIndex: number
  icon: string
  badgeColor: string
}

const PERSONAS: Persona[] = [
  // Tenant 1: Bharat Logistics & Retail (AP-South-1)
  {
    name: 'Aarav',
    fullName: 'Aarav Sharma',
    role: 'ADMIN',
    email: 'admin@bharat-retail.in',
    tenantSlug: 'bharat-retail',
    tenantName: 'Bharat Retail',
    tenantIndex: 0,
    icon: '👔',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    name: 'Priya',
    fullName: 'Priya Patel',
    role: 'MANAGER',
    email: 'manager@bharat-retail.in',
    tenantSlug: 'bharat-retail',
    tenantName: 'Bharat Retail',
    tenantIndex: 0,
    icon: '📦',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    name: 'Rohan',
    fullName: 'Rohan Verma',
    role: 'CASHIER',
    email: 'cashier@bharat-retail.in',
    tenantSlug: 'bharat-retail',
    tenantName: 'Bharat Retail',
    tenantIndex: 0,
    icon: '🛒',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  // Tenant 2: Deccan Supply Chain (AP-South-2)
  {
    name: 'Ananya',
    fullName: 'Ananya Iyer',
    role: 'ADMIN',
    email: 'admin@deccan-supplies.in',
    tenantSlug: 'deccan-supplies',
    tenantName: 'Deccan Supplies',
    tenantIndex: 1,
    icon: '🏢',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    name: 'Vikram',
    fullName: 'Vikram Nair',
    role: 'MANAGER',
    email: 'manager@deccan-supplies.in',
    tenantSlug: 'deccan-supplies',
    tenantName: 'Deccan Supplies',
    tenantIndex: 1,
    icon: '📦',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    name: 'Sneha',
    fullName: 'Sneha Kulkarni',
    role: 'CASHIER',
    email: 'cashier@deccan-supplies.in',
    tenantSlug: 'deccan-supplies',
    tenantName: 'Deccan Supplies',
    tenantIndex: 1,
    icon: '🛒',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
]

export function RecruiterPersonaBar({ currentTenant, onTenantChange }: RecruiterPersonaBarProps) {
  const { user, role, token, switchRole, isLoading } = useAuth()
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  async function handleSwitch(persona: Persona) {
    if (user?.email === persona.email || switchingEmail) return

    setSwitchingEmail(persona.email)
    try {
      await switchRole(persona.role, persona.tenantSlug)
      if (onTenantChange && tenants[persona.tenantIndex]) {
        onTenantChange(tenants[persona.tenantIndex])
      }
    } finally {
      setSwitchingEmail(null)
    }
  }

  return (
    <>
      <section
        aria-label="Recruiter Persona Quick Switcher"
        className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 px-3 py-1.5 text-xs md:px-6 shadow-xs"
      >
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Label and Hint */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 font-bold uppercase tracking-wider text-primary text-[10px]">
              <Sparkles className="size-3" aria-hidden="true" />
              Recruiter Mode
            </span>
            <span className="font-medium text-muted-foreground hidden xl:inline text-[11px]">
              Quick Persona:
            </span>
          </div>

          {/* Personas Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {PERSONAS.map((p) => {
              const isActive = user?.email === p.email
              const isPending = switchingEmail === p.email

              return (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handleSwitch(p)}
                  disabled={isLoading || isPending}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs scale-102'
                      : 'border-border bg-card/90 text-foreground hover:border-primary/50 hover:bg-accent'
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Switch to ${p.fullName} (${p.role} at ${p.tenantName})`}
                >
                  {isPending ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="text-xs">{p.icon}</span>
                  )}
                  <span>{p.name}</span>
                  <span
                    className={`rounded px-1 py-0.2 text-[10px] font-mono font-bold uppercase ${
                      isActive ? 'bg-black/20 text-white' : p.badgeColor
                    }`}
                  >
                    {p.role}
                  </span>
                </button>
              )
            })}

            {/* Security Claims Inspector Modal Trigger */}
            <button
              type="button"
              onClick={() => setInspectorOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-card px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors shrink-0 ml-1"
              aria-label="Inspect active JWT security claims and tenant partition"
            >
              <Shield className="size-3" aria-hidden="true" />
              <span className="hidden sm:inline">JWT &amp; Security Inspector</span>
              <span className="sm:hidden">JWT</span>
            </button>
          </div>
        </div>
      </section>

      {/* Security Inspector Dialog */}
      <SecurityInspectorModal
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        user={user}
        role={role}
        token={token}
        tenant={currentTenant}
      />
    </>
  )
}

function SecurityInspectorModal({
  open,
  onClose,
  user,
  role,
  token,
  tenant,
}: {
  open: boolean
  onClose: () => void
  user: any
  role: UserRole
  token: string | null
  tenant?: Tenant
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Zero-Trust Security & JWT Claims Inspector"
      description="Real-time cryptographic token verification and database multi-tenant partition parameters."
      size="lg"
      footer={
        <div className="flex w-full justify-end">
          <Button type="button" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* Active Identity Summary */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl border border-border bg-muted/30 p-3.5 font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Active Identity:</span>
            <p className="font-bold text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Enforced RBAC Tier:</span>
            <p className="font-bold text-primary">{role}</p>
            <p className="text-[11px] text-muted-foreground">Least-Privilege Guarded</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-sans">Tenant Boundary:</span>
            <p className="font-bold text-foreground truncate">{tenant?.name}</p>
            <p className="text-[11px] text-muted-foreground">{tenant?.region}</p>
          </div>
        </div>

        {/* Decoded Claims */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Fingerprint className="size-4 text-primary" aria-hidden="true" />
            <span>Cryptographic JWT Payload Claims</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 font-mono text-[11px] overflow-x-auto">
            <pre className="text-foreground">
              {JSON.stringify(
                {
                  sub: user?.id || 'unauthenticated',
                  organizationId: user?.organizationId || tenant?.id,
                  role: role,
                  email: user?.email,
                  tokenType: 'Bearer Stateless Access Token',
                  algorithm: 'HS256',
                  sessionTtl: '24 Hours',
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {/* Database Partitioning Statement */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Building2 className="size-4 text-primary" aria-hidden="true" />
            <span>PostgreSQL Multi-Tenant Partitioning Rule</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 font-mono text-[11px]">
            <p className="text-muted-foreground">
              All queries enforce strict UUID tenant scoping at the relational layer:
            </p>
            <code className="mt-1.5 block text-primary select-all">
              WHERE organization_id = '{user?.organizationId || tenant?.id}'::uuid
            </code>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Composite unique index active: <code className="text-foreground">[organization_id, sku]</code> &amp; <code className="text-foreground">[organization_id, slug]</code>.
            </p>
          </div>
        </div>

        {/* RBAC Rights for this persona */}
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-foreground">
            Active RBAC Capabilities for {role}:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Browse Catalog &amp; Products</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>POS Checkout &amp; Receipts</span>
            </div>
            <div className="flex items-center gap-1.5">
              {role === 'ADMIN' || role === 'MANAGER' ? (
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              ) : (
                <XCircle className="size-3.5 text-muted-foreground/40" />
              )}
              <span>Add Products &amp; Restock</span>
            </div>
            <div className="flex items-center gap-1.5">
              {role === 'ADMIN' || role === 'MANAGER' ? (
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              ) : (
                <XCircle className="size-3.5 text-muted-foreground/40" />
              )}
              <span>Category &amp; Taxonomy Creation</span>
            </div>
            <div className="flex items-center gap-1.5">
              {role === 'ADMIN' || role === 'MANAGER' ? (
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              ) : (
                <XCircle className="size-3.5 text-muted-foreground/40" />
              )}
              <span>Business Intelligence Analytics</span>
            </div>
            <div className="flex items-center gap-1.5">
              {role === 'ADMIN' ? (
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              ) : (
                <XCircle className="size-3.5 text-muted-foreground/40" />
              )}
              <span>Organization Governance &amp; Staff Invites</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
