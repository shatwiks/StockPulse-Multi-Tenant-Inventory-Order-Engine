'use client'

import React, { useState, useEffect } from 'react'
import {
  Activity,
  Layers,
  Lock,
  Cpu,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react'
import { StockPulse3DLogo } from './stockpulse-3d-logo'
import { BrandLockup } from './brand-lockup'
import { LoginForm } from './login-form'

export function LoginPageView() {
  const [latency, setLatency] = useState(12)

  // Subtle real-time latency jitter to simulate live enterprise telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(Math.floor(10 + Math.random() * 5))
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative min-h-screen w-full bg-[#171310] text-foreground flex flex-col overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Ambient Lighting & Telemetry Grid */}
      <div
        className="fixed inset-0 pointer-events-none telemetry-grid-bg opacity-40 z-0"
        aria-hidden="true"
      />
      <div
        className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#D97706]/15 via-[#F59E0B]/10 to-transparent rounded-full blur-[140px] pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#2B2118] via-[#F59E0B]/10 to-transparent rounded-full blur-[120px] pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Top Ambient Status Header */}
      <header className="relative z-10 w-full px-6 py-4 border-b border-white/10 bg-[#1F1A17] flex items-center justify-between">
        <BrandLockup size="sm" showTagline={false} />

        <div className="flex items-center gap-4 text-xs font-sans">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#2B2118] border border-amber-500/20 text-stone-200">
            <Server className="size-3 text-[#FBBF24]" />
            <span className="font-sans">AP-South-1 (Mumbai)</span>
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span className="text-amber-300 font-bold font-mono">{latency}ms</span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-200 text-xs font-sans">
            <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
            <span className="hidden md:inline text-stone-300">SYSTEM STATUS:</span>
            <span className="text-amber-400 font-semibold">ALL ENGINES ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)] divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* LEFT COLUMN: 3D Interactive Warehouse Cube & Engine Telemetry (7 Cols) */}
        <section
          aria-label="3D Engine Showcase"
          className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-hidden bg-[#171310]"
        >
          {/* Header Title Lockup */}
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-sans font-medium mb-4">
              <Sparkles className="size-3.5 text-[#FBBF24]" />
              <span>Real-Time High-Concurrency Warehouse Core</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-[#F3E8E2]">
              Pessimistic Locking &amp;{' '}
              <span className="text-[#F59E0B]">
                Live Inventory Pulse.
              </span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-stone-200 leading-relaxed font-sans">
              Engineered for zero-oversell guarantee under peak simultaneous checkouts.
              Seamless row-level multi-tenant isolation across automated warehouse pods.
            </p>
          </div>

          {/* Central 3D Interactive Stage */}
          <div className="relative z-10 my-4 flex items-center justify-center min-h-[380px] lg:min-h-[440px]">
            <StockPulse3DLogo className="w-full max-w-lg" showTelemetryHUD={true} />
          </div>

          {/* Engine Highlights / Architecture Proofs */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-xs font-sans">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5 text-[#FBBF24]">
                <Lock className="size-4" />
              </div>
              <div>
                <div className="font-bold text-[#F3E8E2] text-sm">Atomic Locks</div>
                <div className="text-xs text-stone-300 mt-1 leading-snug">SELECT FOR UPDATE with zero deadlocks</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5 text-[#F59E0B]">
                <Layers className="size-4" />
              </div>
              <div>
                <div className="font-bold text-[#F3E8E2] text-sm">Multi-Tenant</div>
                <div className="text-xs text-stone-300 mt-1 leading-snug">Strict schema &amp; tenant-id data partition</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5 text-[#D97706]">
                <Activity className="size-4" />
              </div>
              <div>
                <div className="font-bold text-[#F3E8E2] text-sm">Live Pulse</div>
                <div className="text-xs text-stone-300 mt-1 leading-snug">Sub-millisecond inventory pub/sub stream</div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Authentication Console & 1-Click Evaluation (5 Cols) */}
        <section
          aria-label="Login Console"
          className="lg:col-span-5 flex flex-col justify-center p-6 sm:p-10 lg:p-12 bg-[#1B1613] relative"
        >
          <div className="relative z-10 w-full max-w-md mx-auto">
            {/* Brand Header */}
            <div className="mb-6 text-center">
              <BrandLockup size="lg" align="center" showTagline={true} />
              <p className="mt-3 text-sm text-[#F3E8E2] leading-normal font-sans">
                Enter your multi-tenant credentials or select a pre-configured persona below to launch console.
              </p>
            </div>

            {/* Login Form with Persona Picker */}
            <LoginForm />
          </div>

          {/* Console Sub-Footer */}
          <footer className="relative z-10 mt-8 pt-6 border-t border-white/10 text-center text-xs text-stone-300 font-sans">
            <span>StockPulse Engine &copy; 2026 Bharat Logistics &amp; Deccan Supply Chain</span>
          </footer>
        </section>
      </main>
    </div>
  )
}
