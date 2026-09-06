'use client'

import React from 'react'
import { Boxes, ShoppingCart, BarChart3, PlusCircle, Headset } from 'lucide-react'
import { cn } from '@/lib/utils'

type StickyMobileBarProps = {
  activeKey: string
  onNavigate: (key: string) => void
  onOpenSupport: () => void
}

export function StickyMobileBar({
  activeKey,
  onNavigate,
  onOpenSupport,
}: StickyMobileBarProps) {
  return (
    <aside
      aria-label="Mobile Navigation & Quick Action Bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1F1A17]/95 backdrop-blur-xl border-t border-[#2B2118] px-3 py-2 shadow-2xl shadow-black/90 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => onNavigate('inventory')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all',
            activeKey === 'inventory'
              ? 'text-[#F59E0B] bg-amber-500/10'
              : 'text-stone-400 hover:text-stone-200'
          )}
        >
          <Boxes className="size-4.5" />
          <span>Inventory</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('orders')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all',
            activeKey === 'orders'
              ? 'text-[#F59E0B] bg-amber-500/10'
              : 'text-stone-400 hover:text-stone-200'
          )}
        >
          <ShoppingCart className="size-4.5" />
          <span>POS Orders</span>
        </button>

        {/* Primary Sticky CTA: Quick Create Order */}
        <button
          type="button"
          onClick={() => onNavigate('orders')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#171310] font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <PlusCircle className="size-4" />
          <span>New Order</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('analytics')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all',
            activeKey === 'analytics'
              ? 'text-[#F59E0B] bg-amber-500/10'
              : 'text-stone-400 hover:text-stone-200'
          )}
        >
          <BarChart3 className="size-4.5" />
          <span>Metrics</span>
        </button>

        <button
          type="button"
          onClick={onOpenSupport}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-semibold text-stone-400 hover:text-[#FBBF24] transition-all"
          title="Contact Logistics Hub"
        >
          <Headset className="size-4.5" />
          <span>Support</span>
        </button>
      </div>
    </aside>
  )
}
