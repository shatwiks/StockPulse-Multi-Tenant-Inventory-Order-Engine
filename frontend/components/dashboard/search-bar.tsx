'use client'

import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')

  // Debounce the raw input before it would hit a query.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), 300)
    return () => clearTimeout(timeout)
  }, [value])

  useEffect(() => {
    if (debouncedValue) {
      console.log('[v0] Debounced search:', debouncedValue)
    }
  }, [debouncedValue])

  // Cmd/Ctrl + K focuses the search field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="relative flex w-full max-w-md items-center">
      <Search
        className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label="Search inventory, orders, and SKUs"
        placeholder="Search SKUs, orders, suppliers…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-card pr-16 pl-9 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <kbd className="pointer-events-none absolute right-2.5 hidden items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground sm:inline-flex">
        <span className="text-sm">⌘</span>K
      </kbd>
    </div>
  )
}
