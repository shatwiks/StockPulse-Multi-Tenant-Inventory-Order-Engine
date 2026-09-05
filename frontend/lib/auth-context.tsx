'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  apiClient,
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  getStoredUser,
  setStoredUser,
  type ApiUser,
} from './api-client'
import { toast } from './toast-context'
import { useQueryClient } from '@tanstack/react-query'

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER'

interface AuthContextValue {
  user: ApiUser | null
  token: string | null
  role: UserRole
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password?: string) => Promise<boolean>
  logout: () => void
  switchRole: (newRole: UserRole, tenantSlug?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DEFAULT_DEMO_EMAIL = 'admin@acme-retail.com'
const DEFAULT_DEMO_PASS = 'StockPulse2026!'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setTokenState] = useState<string | null>(null)
  const [user, setUserState] = useState<ApiUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applyAuth = useCallback((jwt: string, userData: ApiUser) => {
    setAuthToken(jwt)
    setStoredUser(userData)
    setTokenState(jwt)
    setUserState(userData)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setTokenState(null)
    setUserState(null)
    queryClient.clear()
    toast.info('Session ended. Signed out successfully.')
  }, [queryClient])

  const login = useCallback(
    async (email: string, password = DEFAULT_DEMO_PASS): Promise<boolean> => {
      try {
        setIsLoading(true)
        const res = await apiClient.post(
          'auth/login',
          { email, password },
          { skipAuth: true }
        )

        if (res.success && res.data) {
          applyAuth(res.data.token, res.data.user)
          queryClient.invalidateQueries()
          toast.success(`Logged in as ${res.data.user.role}: ${res.data.user.email}`)
          return true
        }
        return false
      } catch (err: any) {
        console.error('Login error:', err)
        toast.error(err.message || 'Login failed', 'Authentication Error')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [applyAuth, queryClient]
  )

  const switchRole = useCallback(
    async (newRole: UserRole, tenantSlug = 'acme-retail') => {
      const emailDomain = tenantSlug.includes('summit') ? 'summit-supplies.com' : 'acme-retail.com'
      const email = `${newRole.toLowerCase()}@${emailDomain}`

      setIsLoading(true)
      try {
        const success = await login(email, DEFAULT_DEMO_PASS)
        if (success) {
          toast.info(`Switched perspective to ${newRole} (${email})`)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [login]
  )

  // Initialize session on mount
  useEffect(() => {
    const existingToken = getAuthToken()
    const existingUser = getStoredUser()

    if (existingToken && existingUser) {
      setTokenState(existingToken)
      setUserState(existingUser)
      setIsLoading(false)
    } else {
      // Auto-authenticate with default demo user for seamless zero-friction dev experience
      login(DEFAULT_DEMO_EMAIL, DEFAULT_DEMO_PASS).catch(() => {
        setIsLoading(false)
      })
    }

    const handleUnauthorized = () => {
      logout()
    }

    window.addEventListener('stockpulse:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('stockpulse:unauthorized', handleUnauthorized)
  }, [login, logout])

  const role: UserRole = user?.role || 'CASHIER'
  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
