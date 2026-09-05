'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={
        mounted
          ? `Switch to ${isDark ? 'light' : 'dark'} theme`
          : 'Toggle theme'
      }
      className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {mounted && isDark ? (
        <Moon className="size-4.5" aria-hidden="true" />
      ) : (
        <Sun className="size-4.5" aria-hidden="true" />
      )}
    </button>
  )
}
