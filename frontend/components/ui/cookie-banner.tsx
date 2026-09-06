'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X, Check, Shield } from 'lucide-react'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('stockpulse_cookie_consent')
      if (!consent) {
        setShowBanner(true)
      }
    } catch {
      // Ignore local storage errors
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem('stockpulse_cookie_consent', 'accepted')
    } catch {}
    setShowBanner(false)
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem('stockpulse_cookie_consent', 'essential_only')
    } catch {}
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div
      role="region"
      aria-label="Cookie & Telemetry Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl bg-[#1F1A17] border border-amber-500/30 text-foreground shadow-2xl shadow-black/80 font-sans animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-[#FBBF24]">
          <Cookie className="size-4.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-[#F3E8E2] tracking-wide flex items-center gap-1.5">
              <Shield className="size-3 text-amber-400" />
              Operational Cookies &amp; Telemetry
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close banner"
              className="text-stone-400 hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed mb-3">
            StockPulse uses essential session tokens and performance telemetry to maintain pessimistic lock states and prevent cross-tenant data leakage.{' '}
            <Link href="/privacy" className="text-amber-400 hover:underline">
              Privacy Policy
            </Link>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#171310] font-bold text-xs shadow-sm transition-all"
            >
              <Check className="size-3.5" />
              <span>Accept Telemetry</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg bg-[#2B2118] hover:bg-white/10 border border-white/10 text-stone-300 font-medium text-xs transition-all"
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
