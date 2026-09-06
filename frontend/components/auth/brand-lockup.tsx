'use client'

import React from 'react'
import { StockPulseVectorLogo } from './stockpulse-vector-logo'

interface BrandLockupProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showIcon?: boolean
  showTagline?: boolean
  className?: string
  align?: 'left' | 'center'
}

export function BrandLockup({
  size = 'md',
  showIcon = true,
  showTagline = true,
  className = '',
  align = 'left',
}: BrandLockupProps) {
  const iconSizes = {
    sm: 32,
    md: 44,
    lg: 56,
    xl: 72,
  }

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
  }

  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-xs sm:text-sm',
    xl: 'text-sm',
  }

  return (
    <div
      className={`inline-flex ${
        align === 'center' ? 'flex-col items-center text-center' : 'items-center gap-3.5'
      } ${className}`}
    >
      {showIcon && (
        <div className="relative shrink-0">
          <StockPulseVectorLogo size={iconSizes[size]} animated showGlow />
        </div>
      )}

      <div className={`flex flex-col ${align === 'center' ? 'items-center mt-3' : ''}`}>
        <div className={`font-display font-extrabold tracking-tight leading-none ${textSizes[size]}`}>
          {/* "Stock" in semi-bold charcoal-cream (#F3E8E2) */}
          <span className="font-semibold text-[#F3E8E2]">
            Stock
          </span>
          {/* "Pulse" in solid warm amber (#F59E0B) */}
          <span className="ml-0.5 text-[#F59E0B]">
            Pulse
          </span>
        </div>

        {showTagline && (
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`font-mono font-medium tracking-wider uppercase text-amber-200/80 ${taglineSizes[size]}`}
            >
              Inventory &amp; Order Engine
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-mono text-amber-300 font-semibold">
              <span className="size-1.5 rounded-full bg-amber-400" />
              v2.4 Live
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
