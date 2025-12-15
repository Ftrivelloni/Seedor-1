"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "../../../components/sidebar"
import { FarmDetailPage } from "../../../components/campo/farm-detail-page"
import { useAuth } from "../../../hooks/use-auth"
import { useIsMobile } from "../../../hooks/use-mobile"
import { FeatureProvider } from "../../../lib/features-context"

export default function FarmPage({ params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = use(params)
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["admin", "campo"]
  })
  const router = useRouter()
  const isMobile = useIsMobile()

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
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          onNavigate={(page) => {
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
          }} 
          currentPage="campo" 
        />
        <div className={isMobile ? "flex-1 flex flex-col pt-14 pb-20" : "flex-1 flex flex-col"}>
          <FarmDetailPage farmId={farmId} user={user} />
        </div>
      </div>
    </FeatureProvider>
  )
}
