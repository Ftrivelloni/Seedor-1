"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { authService } from "../../lib/supabaseAuth"

export const UserContext = createContext<any>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true)
      const sessionUser = await authService.checkSession()
      setUser(sessionUser)
      setLoading(false)
    }
    loadUser()
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
