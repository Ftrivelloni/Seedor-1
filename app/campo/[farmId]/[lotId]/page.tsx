"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "../../../../components/sidebar"
import { LotTasksPage } from "../../../../components/campo/lot-tasks-page"
import { useAuth } from "../../../../hooks/use-auth"
import { FeatureProvider } from "../../../../lib/features-context"

export default function LotPage({ 
  params 
}: { 
  params: Promise<{ farmId: string; lotId: string }> 
}) {
  const { farmId, lotId } = use(params)
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["admin", "campo"]
  })
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <FeatureProvider user={user}>
      <div className="min-h-screen bg-background flex">
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          onNavigate={(page) => {
            const pageRoutes: Record<string, string> = {
              dashboard: "/home",
              campo: "/campo",
              empaque: "/empaque",
              inventario: "/inventario",
              tasks: "/tasks",
              finanzas: "/finanzas",
              ajustes: "/ajustes",
              trabajadores: "/trabajadores",
              contactos: "/contactos",
            }
            const targetRoute = pageRoutes[page] || "/home"
            router.push(targetRoute)
          }} 
          currentPage="campo" 
        />
        <div className="flex-1 flex flex-col">
          <LotTasksPage farmId={farmId} lotId={lotId} user={user} />
        </div>
      </div>
    </FeatureProvider>
  )
}
