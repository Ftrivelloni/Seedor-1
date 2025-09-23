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
      
      setLoading(true)
      try {
        console.log('UserContext: Loading user session...')
        const { user: sessionUser, error } = await authService.getSafeSession()
        if (error) {
          console.log('UserContext: Session error:', error)
        }
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
            console.log('Auth state changed:', event, session?.user?.email)
            
            // Prevent recursive updates
            if (isUpdatingRef.current) {
              console.log('Skipping auth state change - already updating')
              return
            }
            
            isUpdatingRef.current = true
            
            try {
              if (event === 'SIGNED_OUT') {
                console.log('User signed out')
                setUser(null)
              } else if (event === 'SIGNED_IN' && session?.user) {
                console.log('User signed in, loading profile...')
                const { user: newUser } = await authService.getSafeSession()
                setUser(newUser)
              } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                console.log('Token refreshed, user should remain the same')
                // Don't reload user data for token refresh - just log it
                // The current user should still be valid
              }
            } catch (error) {
              console.error('Error handling auth state change:', error)
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
