'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Building,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/lib/toast-context'
import { DemoPersonaPicker, type DemoPersona } from './demo-persona-picker'

const DEFAULT_DEMO_PASS = 'StockPulse2026!'

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('admin@bharat-retail.in')
  const [password, setPassword] = useState(DEFAULT_DEMO_PASS)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setErrorMessage('Please enter your work email address.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const success = await login(email, password)
      if (success) {
        router.push('/')
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      } else {
        setErrorMessage('Authentication failed. Check your credentials or try a 1-click demo persona.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectPersona = async (persona: DemoPersona) => {
    setEmail(persona.email)
    setPassword(DEFAULT_DEMO_PASS)
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const success = await login(persona.email, DEFAULT_DEMO_PASS)
      if (success) {
        router.push('/')
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      } else {
        setErrorMessage(`Failed to sign in as ${persona.name}.`)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error signing into demo persona.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      {/* 1-Click Evaluation Persona Quick Picker - Flattened without nested card wrapping */}
      <DemoPersonaPicker
        onSelectPersona={handleSelectPersona}
        disabled={isSubmitting}
        selectedEmail={email}
      />

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-white/10" />
        <span className="absolute px-3 bg-[#1B1613] text-xs font-sans font-medium text-stone-300">
          or sign in with credentials
        </span>
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium animate-shake">
            <ShieldAlert className="size-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="login-email"
            className="text-xs font-semibold tracking-wide text-stone-200 font-sans"
          >
            WORK EMAIL
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 size-4 text-amber-500/60 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@company.com"
              disabled={isSubmitting}
              className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#14100E] border border-white/10 text-foreground placeholder:text-muted-foreground/60 text-sm font-medium outline-none transition-all
                focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold tracking-wide text-stone-200 font-sans"
            >
              PASSWORD
            </label>
            <button
              type="button"
              onClick={() => {
                setPassword(DEFAULT_DEMO_PASS)
                toast.info('Default demo password inserted: StockPulse2026!')
              }}
              className="text-xs font-mono text-[#FBBF24] hover:underline"
            >
              Fill Demo Key
            </button>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 size-4 text-amber-500/60 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isSubmitting}
              className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#14100E] border border-white/10 text-foreground placeholder:text-muted-foreground/60 text-sm font-medium outline-none transition-all
                focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Remember Session & SSO */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-stone-300 hover:text-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-white/20 bg-[#14100E] text-[#F59E0B] accent-[#F59E0B] focus:ring-0"
            />
            <span>Remember session</span>
          </label>
          <span className="font-sans text-stone-300 text-xs">Enterprise SAML 2.0</span>
        </div>

        {/* Sign In Button with Solid Warm Amber and Clean Elevation */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative flex items-center justify-center gap-2.5 w-full h-12 mt-2 rounded-xl font-display font-bold text-sm tracking-wide text-[#1A130F]
            bg-[#F59E0B] hover:bg-[#D97706] shadow-lg shadow-black/50
            hover:shadow-xl hover:shadow-black/60 active:scale-[0.99]
            transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]
            disabled:opacity-60 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4.5 animate-spin" />
              <span>Verifying Telemetry Credentials...</span>
            </>
          ) : (
            <>
              <LogIn className="size-4.5 transition-transform group-hover:translate-x-0.5" />
              <span>Sign In to StockPulse Console</span>
            </>
          )}
        </button>
      </form>

      {/* Security & Concurrency Guarantee Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs text-stone-300 font-sans">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-amber-400" />
          <span>Multi-Tenant Row-Level Isolation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400" />
          <span>Pessimistic Concurrency Locked</span>
        </div>
      </div>
    </div>
  )
}
