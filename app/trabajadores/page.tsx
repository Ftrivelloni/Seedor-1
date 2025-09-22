"use client"

import { Sidebar } from "../../components/sidebar"
import TrabajadoresPage from "../../components/trabajadores/trabajadores-page"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService, type AuthUser } from "../../lib/supabaseAuth"

export default function TrabajadoresRoutePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const sessionUser = await authService.checkSession()
      if (sessionUser) {
        setUser(sessionUser)
        setIsLoading(false)
        return
      }

      const currentUser = authService.getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      
      setUser(currentUser)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await authService.logout()
    router.push("/login")
  }

  const handleNavigate = (page: string) => {
    const pageRoutes: Record<string, string> = {
      dashboard: "/home",
      campo: "/campo",
      empaque: "/empaque",
      inventario: "/inventario",
      finanzas: "/finanzas",
      ajustes: "/ajustes",
      trabajadores: "/trabajadores",
      contactos: "/contactos",
    }

    const targetRoute = pageRoutes[page] || "/home"
    router.push(targetRoute)
  }

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

  // Check if user has permission to access trabajadores
  if (!["Admin", "Campo"].includes(user.rol)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-4">No tienes permisos para acceder a esta sección</p>
          <button 
            onClick={() => router.push("/home")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        onNavigate={handleNavigate} 
        currentPage="trabajadores" 
      />
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold">Trabajadores</h1>
              <p className="text-sm text-muted-foreground">Gestión de trabajadores - {user.tenant.name}</p>
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
            <TrabajadoresPage />
          </div>
        </main>
      </div>
    </div>
  )
}
