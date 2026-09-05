'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

// Global event bus for non-React callers (e.g., api-client.ts)
const TOAST_EVENT = 'stockpulse:toast'

export const toast = {
  success: (message: string, title?: string, duration = 4000) => {
    dispatchToast({ type: 'success', message, title, duration })
  },
  error: (message: string, title?: string, duration = 5000) => {
    dispatchToast({ type: 'error', message, title, duration })
  },
  warning: (message: string, title?: string, duration = 4500) => {
    dispatchToast({ type: 'warning', message, title, duration })
  },
  info: (message: string, title?: string, duration = 4000) => {
    dispatchToast({ type: 'info', message, title, duration })
  },
}

function dispatchToast(toastData: Omit<ToastItem, 'id'>) {
  if (typeof window !== 'undefined') {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { ...toastData, id } }))
  }
}

interface ToastContextValue {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      toasts: [],
      addToast: dispatchToast,
      removeToast: () => {},
      toast,
    }
  }
  return { ...context, toast }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    setToasts((prev) => [...prev, { ...t, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  useEffect(() => {
    const handleCustomToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastItem>
      if (customEvent.detail) {
        setToasts((prev) => [...prev, customEvent.detail])
      }
    }

    window.addEventListener(TOAST_EVENT, handleCustomToast)
    return () => window.removeEventListener(TOAST_EVENT, handleCustomToast)
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2.5 pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastNotification key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastNotification({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(item.id)
    }, item.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [item.id, item.duration, onDismiss])

  const icons = {
    success: <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />,
    error: <AlertCircle className="size-4 shrink-0 text-rose-400" aria-hidden="true" />,
    warning: <AlertTriangle className="size-4 shrink-0 text-amber-400" aria-hidden="true" />,
    info: <Info className="size-4 shrink-0 text-sky-400" aria-hidden="true" />,
  }

  const borderStyles = {
    success: 'border-emerald-500/40 bg-[#1c1813]/95 text-emerald-100 shadow-emerald-950/40',
    error: 'border-rose-500/40 bg-[#1c1813]/95 text-rose-100 shadow-rose-950/40',
    warning: 'border-amber-500/40 bg-[#1c1813]/95 text-amber-100 shadow-amber-950/40',
    info: 'border-sky-500/40 bg-[#1c1813]/95 text-sky-100 shadow-sky-950/40',
  }

  const isAssertive = item.type === 'error'

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
        borderStyles[item.type]
      }`}
    >
      <div className="mt-0.5">{icons[item.type]}</div>
      <div className="flex-1 min-w-0">
        {item.title && (
          <h5 className="text-xs font-semibold tracking-wide text-foreground mb-0.5">
            {item.title}
          </h5>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed break-words">
          {item.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
