"use client"
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react"
import { authService } from "../../lib/supabaseAuth"

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
      
      // IMPORTANT FIX: First check if we have a currentUser in authService already
      // This handles the case where we just logged in and currentUser is set
      const directUser = authService.getCurrentUser();
      if (directUser) {
        console.log('✅ UserContext: Using existing user from authService:', directUser.email);
        setUser(directUser);
        setLoading(false);
        return;
      }
      
      try {
        console.log('🔍 UserContext: No cached user, calling getSafeSession...');
        const { user: sessionUser, error } = await authService.getSafeSession();
        
        console.log('🔍 UserContext: getSafeSession result:', { user: sessionUser?.email, error });
        
        if (error) {
          // If it's a refresh token error, clear the session
          if (typeof error === 'string' && (
              error.includes('refresh_token_not_found') || 
              error.includes('Invalid Refresh Token'))) {
            console.warn('⚠️ UserContext: Invalid refresh token, clearing session');
            await authService.logout();
            setUser(null);
            setLoading(false);
            return;
          }
        }
        
        setUser(sessionUser);
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

    // Set up auth state change listener for real-time auth updates
    const setupAuthListener = async () => {
      try {
        // Import supabase client dynamically to avoid SSR issues
        const { supabase } = await import("../../lib/supabaseClient")
        
        if (supabase?.auth?.onAuthStateChange) {
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
            // Only log important auth events in production
            if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
              console.log('Auth state changed:', event, session?.user?.email)
            }
            
            // Prevent recursive updates
            if (isUpdatingRef.current) {
              return
            }
            
            isUpdatingRef.current = true
            
            try {
              if (event === 'SIGNED_OUT') {
                setUser(null)
              } else if (event === 'SIGNED_IN' && session?.user) {
                const { user: newUser } = await authService.getSafeSession()
                setUser(newUser)
              } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                // Optionally reload user data to ensure it's up to date
                const { user: refreshedUser } = await authService.getSafeSession()
                setUser(refreshedUser)
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

          // Cleanup listener on unmount
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
