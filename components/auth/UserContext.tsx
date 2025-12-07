"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { authService, sessionManager } from "../../lib/auth"

/**
 * @deprecated Use AuthContext from lib/auth instead
 * This file is kept for backwards compatibility only
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
      } catch (error: any) {
        console.error('UserContext: Error loading user session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()

    const setupAuthListener = async () => {
      try {
        const { supabase } = await import("../../lib/supabaseClient")
        
        if (supabase?.auth?.onAuthStateChange) {
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {

            
            // Simplificar el manejo - no usar flags que puedan causar bloqueos
            try {
              if (event === 'SIGNED_OUT') {

                setUser(null)
                // Limpiar también el SessionManager
                sessionManager.clearCurrentTabSession()
              } else if (event === 'SIGNED_IN' && session?.user) {

                // No actualizar aquí para evitar conflictos
                // El login flow ya maneja esto a través del SessionManager
              } else if (event === 'TOKEN_REFRESHED') {

                // El SessionManager maneja la validación de tokens
              }
            } catch (error) {
              console.error('Error handling auth state change:', error)
            }
          })

          return () => {
            authListener?.subscription?.unsubscribe()
          }
        }
      } catch (error) {
        console.error('Error setting up auth listener:', error)
      }
    }

    setupAuthListener()

    // Listen for session updates dispatched by SessionManager (same tab) and storage events (cross-tab)
    const handleSessionUpdate = () => {
      try {
        const latest = sessionManager.peekCurrentUser()
        setUser(latest)
      } catch (e) {
        console.error('Error handling session update:', e)
      }
    }

    window.addEventListener('seedor:session-updated', handleSessionUpdate)
    window.addEventListener('storage', handleSessionUpdate)

    return () => {
      window.removeEventListener('seedor:session-updated', handleSessionUpdate)
      window.removeEventListener('storage', handleSessionUpdate)
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