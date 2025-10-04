"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { useUser } from "../../components/auth/UserContext"
import { UserManagement } from "../../components/admin/user-management"
import { FeatureProvider } from "../../lib/features-context"

export default function UsuariosRoutePage() {
  const { user, loading } = useUser()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <FeatureProvider user={user}>
      <div className="min-h-screen bg-background flex">
        <Sidebar 
          user={user} 
          onLogout={() => { router.push("/login") }} 
          onNavigate={(page) => {
            // Map page names to their correct routes
            const pageRoutes: Record<string, string> = {
              dashboard: "/home",
              campo: "/campo",
              empaque: "/empaque",
              inventario: "/inventario",
              finanzas: "/finanzas",
              ajustes: "/ajustes",
              trabajadores: "/trabajadores",
              contactos: "/contactos",
              usuarios: "/usuarios"
            }
            
            const route = pageRoutes[page] || `/${page}`
            router.push(route)
          }}
          currentPage="usuarios"
        />
        
        <main className="flex-1 overflow-hidden">
          <div className="p-6">
            <UserManagement currentUser={user} />
          </div>
        </main>
      </div>
    </FeatureProvider>
  )
}