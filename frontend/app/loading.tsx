import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#171310] text-[#F3E8E2] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#2B2118]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#2B2118]" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-[#2B2118] rounded-md" />
              <div className="h-3 w-48 bg-[#2B2118]/60 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-[#2B2118] rounded-xl" />
            <div className="size-9 bg-[#2B2118] rounded-xl" />
          </div>
        </div>

        {/* 4 Metric cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#1F1A17] border border-[#2B2118] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-[#2B2118] rounded" />
                <div className="size-7 bg-[#2B2118] rounded-lg" />
              </div>
              <div className="h-7 w-28 bg-[#2B2118] rounded-md" />
              <div className="h-3 w-36 bg-[#2B2118]/60 rounded" />
            </div>
          ))}
        </div>

        {/* Action bar skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#1F1A17] border border-[#2B2118]">
          <div className="h-9 w-64 bg-[#2B2118] rounded-xl" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-[#2B2118] rounded-xl" />
            <div className="h-9 w-28 bg-[#F59E0B]/20 rounded-xl" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl bg-[#1F1A17] border border-[#2B2118] overflow-hidden">
          <div className="p-4 border-b border-[#2B2118] flex items-center justify-between">
            <div className="h-5 w-36 bg-[#2B2118] rounded" />
            <div className="h-4 w-20 bg-[#2B2118]/60 rounded" />
          </div>
          <div className="divide-y divide-[#2B2118]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-[#2B2118]" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 bg-[#2B2118] rounded" />
                    <div className="h-3 w-24 bg-[#2B2118]/50 rounded" />
                  </div>
                </div>
                <div className="hidden sm:block h-4 w-24 bg-[#2B2118] rounded" />
                <div className="h-4 w-16 bg-[#2B2118] rounded" />
                <div className="h-6 w-20 bg-[#2B2118] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
