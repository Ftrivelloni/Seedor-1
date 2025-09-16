"use client"

import { Sidebar } from "../../components/sidebar"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService, type AuthUser } from "../../lib/auth"

export default function EmpaqueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        user={user} 
        onLogout={() => { router.push("/login") }} 
        onNavigate={(page) => {
          if (page === "empaque") {
            router.push("/empaque")
          } else {
            router.push("/home")
          }
        }} 
        currentPage="empaque" 
      />
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold">Empaque</h1>
              <p className="text-sm text-muted-foreground">Gestión de empaque y procesamiento - {user.tenant.nombre}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.nombre}</p>
                <p className="text-xs text-muted-foreground">{user.rol}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}