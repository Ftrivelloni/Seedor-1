"use client"
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react"
import { authService } from "../../lib/auth" // Ahora usa auth unificado

export const UserContext = createContext<any>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const isUpdatingRef = useRef(false)

  useEffect(() => {
    const loadUser = async () => {
      if (isUpdatingRef.current) return
      
      // Check if we're on a public page that doesn't need auth
      if (typeof window !== 'undefined') {
        const publicPaths = ['/', '/login', '/register-tenant', '/forgot-password', '/reset-password', '/contacto', '/funcionalidades']
        const currentPath = window.location.pathname
        
        // If we're on a public page, don't check session
        if (publicPaths.includes(currentPath) || publicPaths.some(path => currentPath.startsWith(path))) {
          setLoading(false)
          setUser(null)
          return
        }
      }
      
      console.log('🔄 UserContext: Loading user...');
      setLoading(true)
      try {
        console.log('UserContext: Loading user session...')
        const sessionUser = await authService.checkSession()
        
        if (sessionUser) {
          console.log('UserContext: User loaded successfully:', {
            email: sessionUser.email,
            rol: sessionUser.rol,
            tenantId: sessionUser.tenantId
          })
        } else {
          console.log('UserContext: No user session found')
        }
        setUser(sessionUser)
      } catch (error: any) {
        console.error('UserContext: Error loading user session:', error)
        
        // Handle specific authentication errors
        if ((error?.message && typeof error.message === 'string' && (
            error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token') ||
            error.message.includes('AuthApiError'))) ||
            (typeof error === 'string' && (
            error.includes('refresh_token_not_found') ||
            error.includes('Invalid Refresh Token') ||
            error.includes('AuthApiError')))) {
          console.log('UserContext: Authentication error, clearing session')
          try {
            await authService.logout()
          } catch (logoutError) {
            console.error('UserContext: Error during logout:', logoutError)
          }
        }
        
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
            // Only log important auth events in production
            if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
              console.log('Auth state changed:', event, session?.user?.email)
            }
            
            if (isUpdatingRef.current) {
              return
            }
            
            isUpdatingRef.current = true
            
            try {
              if (event === 'SIGNED_OUT') {
                setUser(null)
              } else if (event === 'SIGNED_IN' && session?.user) {
                console.log('User signed in, loading profile...')
                const newUser = await authService.checkSession() // Usa auth unificado
                setUser(newUser)
              } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                console.log('Token refreshed')
              }
            } catch (error: any) {
              console.error('Error handling auth state change:', error)
              
              // Handle auth errors in state change
              if ((error?.message && typeof error.message === 'string' && (
                  error.message.includes('refresh_token_not_found') || 
                  error.message.includes('Invalid Refresh Token'))) ||
                  (typeof error === 'string' && (
                  error.includes('refresh_token_not_found') ||
                  error.includes('Invalid Refresh Token')))) {
                console.log('Auth state change: Invalid refresh token, signing out')
                setUser(null)
                try {
                  await authService.logout()
                } catch (logoutError) {
                  console.error('Error during logout in auth state change:', logoutError)
                }
              }
            } finally {
              isUpdatingRef.current = false
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
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}