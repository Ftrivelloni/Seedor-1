"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { EnProcesoPage } from "../../components/ui/en-proceso-page";
import { useAuth } from "../../hooks/use-auth";
import { FeatureProvider } from "../../lib/features-context";

export default function FinanzasRoutePage() {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["admin", "finanzas"]
  });
  const router = useRouter();

  console.log('💰 Finanzas Page - User:', user?.email, 'Rol:', user?.rol, 'Loading:', loading);

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
              finanzas: "/finanzas",
              ajustes: "/ajustes",
              trabajadores: "/trabajadores",
              contactos: "/contactos",
              usuarios: "/usuarios"
            };

            const targetRoute = pageRoutes[page] || "/home";
            router.push(targetRoute);
          }} 
          currentPage="finanzas" 
        />
        <div className="flex-1 flex flex-col">
          <EnProcesoPage 
            moduleName="Finanzas"
            description="Módulo de gestión financiera y contabilidad"
          />
        </div>
      </div>
    </FeatureProvider>
  )
}
