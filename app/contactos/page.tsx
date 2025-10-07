"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import ContactosPage from "../../components/contactos/contactos-page"
import { useAuth } from "../../hooks/use-auth";
import { FeatureProvider } from "../../lib/features-context"

export default function ContactosRoutePage() {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["Admin", "Contactos"]
  });
  const router = useRouter();

  console.log('📇 Contactos Page - User:', user?.email, 'Rol:', user?.rol, 'Loading:', loading);

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
            };

            const targetRoute = pageRoutes[page] || "/home";
            router.push(targetRoute);
          }} 
          currentPage="contactos" 
        />
        <div className="flex-1 flex flex-col">
          <ContactosPage />
        </div>
      </div>
    </FeatureProvider>
  )
}
