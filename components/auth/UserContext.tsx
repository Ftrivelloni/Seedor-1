"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { authService, sessionManager } from "../../lib/auth"

/**
 * @deprecated Use AuthContext from lib/auth instead
 * This file is kept for backwards compatibility only.
 * Now uses API-based auth instead of direct Supabase calls.
 */

export const UserContext = createContext<any>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true)
      try {
        // Primero intentar obtener de la sesión de la pestaña (sin actualizar actividad)
        let sessionUser = sessionManager.peekCurrentUser()

        if (!sessionUser) {
          // Si no hay sesión de pestaña, verificar con getSafeSession
          const { user } = await authService.getSafeSessionLegacy()
          sessionUser = user
        }

        // Session loaded successfully
        setUser(sessionUser)
      } catch (error: unknown) {
        console.error('UserContext: Error loading user session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    // Listen for session updates dispatched by SessionManager (same tab) and storage events (cross-tab)
    const handleSessionUpdate = () => {
      try {
        const latest = sessionManager.peekCurrentUser()
        setUser(latest)
      } catch (e) {
        console.error('Error handling session update:', e)
      }
    }

    // Handle logout events by checking token validity
    const handleStorageChange = (e: StorageEvent) => {
      // If seedor tokens were cleared (logout in another tab), clear user
      if (e.key === 'seedor_access_token' && e.newValue === null) {
        setUser(null)
        sessionManager.clearCurrentTabSession()
        return
      }
      // For other storage changes, just update user from session
      handleSessionUpdate()
    }

    window.addEventListener('seedor:session-updated', handleSessionUpdate)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('seedor:session-updated', handleSessionUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const setSelectedTenant = (tenant: any, role?: string) => {
    try {
      const updated = {
        ...user,
        tenant,
        tenantId: tenant?.id || null,
        rol: role || user?.rol || null
      }
      sessionManager.setCurrentUser(updated)
      setUser(updated)
    } catch (e) {
      console.error('setSelectedTenant error:', e)
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, loading, setSelectedTenant }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}

export function useUserActions() {
  const context = useContext(UserContext)
  return {
    clearUser: () => context?.setUser?.(null),
    setUser: context?.setUser,
    setSelectedTenant: context?.setSelectedTenant
  }
}