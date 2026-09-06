'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LoginPageView } from '@/components/auth/login-page-view'

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/')
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }, [isAuthenticated, isLoading, router])

  return <LoginPageView />
}
