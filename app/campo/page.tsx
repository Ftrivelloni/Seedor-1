"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { FarmsList } from "../../components/campo/farms-list";
import { useAuth } from "../../hooks/use-auth";
import { FeatureProvider } from "../../lib/features-context";

export default function CampoRoutePage() {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["Admin", "Campo"]
  });
  const router = useRouter();

  // Debug logs
  console.log('🌾 Campo Page - User:', user?.email, 'Rol:', user?.rol, 'Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!user || !user.tenantId) {
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
              usuarios: "/usuarios",
            };

            const targetRoute = pageRoutes[page] || "/home";
            router.push(targetRoute);
          }} 
          currentPage="campo" 
        />
        <div className="flex-1 flex flex-col">
          <FarmsList user={user} />
        </div>
      </div>
    </FeatureProvider>
  )
}
