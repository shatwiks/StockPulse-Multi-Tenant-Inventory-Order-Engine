'use client'

import React from 'react'
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
  X,
  Send,
  Building2,
  ExternalLink,
} from 'lucide-react'

interface ContactSupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#1F1A17] border border-amber-500/30 text-[#F3E8E2] shadow-2xl p-6 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#FBBF24]">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 id="support-modal-title" className="text-base font-bold text-[#F3E8E2]">
                Enterprise Support &amp; Escalation
              </h2>
              <p className="text-xs text-stone-400">
                Bharat Logistics &amp; Deccan Supply Chain NOC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="size-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Real Physical Address & Contact Info */}
        <div className="space-y-3.5 mb-6 text-xs text-stone-300">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#171310] border border-white/10">
            <MapPin className="size-4.5 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#F3E8E2] mb-0.5">Physical Enterprise Logistics Hub</div>
              <p>Plot C-59, G Block, Bandra Kurla Complex (BKC),</p>
              <p>Bandra East, Mumbai, Maharashtra 400051, India</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#171310] border border-white/10">
              <Mail className="size-4 text-[#FBBF24] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase text-stone-400 block font-mono">24/7 NOC Email</span>
                <span className="font-mono text-stone-200 truncate block">support@bharat-retail.in</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#171310] border border-white/10">
              <Phone className="size-4 text-[#FBBF24] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase text-stone-400 block font-mono">Priority Helpline</span>
                <span className="font-mono text-stone-200 block">+91 (022) 6982-5000</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#171310] border border-white/10 text-stone-300">
            <span className="flex items-center gap-2">
              <Clock className="size-4 text-emerald-400" />
              SLA Response Target: &lt; 15 Minutes
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
              <ShieldCheck className="size-3.5" />
              99.99% UP
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#171310] font-bold text-xs transition-all"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  )
}
