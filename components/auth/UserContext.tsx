"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { authService } from "../../lib/supabaseAuth"
import { supabase } from "../../lib/supabaseClient"

export const UserContext = createContext<any>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      if (initialLoadComplete) return; // Prevent multiple initial loads
      
      setLoading(true)
      
      try {
        // First, try to get the session user
        let sessionUser = await authService.checkSession()
        
        // If no session user, fall back to localStorage user
        if (!sessionUser) {
          sessionUser = authService.getCurrentUser()
        }
        
        setUser(sessionUser)
      } catch (error) {
        console.error('Error loading user:', error)
        setUser(null)
      } finally {
        setLoading(false)
        setInitialLoadComplete(true)
      }
    }
    
    // Load user on mount
    loadUser()
  }, [initialLoadComplete])

  useEffect(() => {
    if (!initialLoadComplete) return; // Don't set up listener until initial load is done
    
    // Listen for auth state changes - but avoid infinite loops
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true)
        try {
          // User signed in - get fresh user data but don't call checkSession to avoid loops
          const { data: worker, error: workerError } = await supabase
            .from('workers')
            .select(`
              *,
              tenant:tenants(*)
            `)
            .eq('email', session.user.email)
            .eq('status', 'active')
            .single();

          if (!workerError && worker) {
            const authUser = {
              id: session.user.id,
              email: worker.email,
              nombre: worker.full_name,
              tenantId: worker.tenant_id,
              rol: worker.area_module === 'Administración' ? 'Admin' : 'Campo',
              activo: worker.status === 'active',
              tenant: worker.tenant,
              worker: worker,
            };
            
            setUser(authUser)
            
            // Update localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('seedor_user', JSON.stringify(authUser));
            }
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error('Error handling sign in:', error)
          setUser(null)
        } finally {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null)
        setLoading(false)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('seedor_user');
        }
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [initialLoadComplete])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
