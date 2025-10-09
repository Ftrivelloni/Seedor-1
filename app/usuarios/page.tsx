"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { UserManagement } from "../../components/admin/user-management"
import { useAuth } from "../../hooks/use-auth"
import { FeatureProvider } from "../../lib/features-context"

export default function UsuariosRoutePage() {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["admin"]
  });
  const router = useRouter();

  // Debug logging
  console.log('🔍 UsuariosPage: user:', user);
  console.log('🔍 UsuariosPage: user.rol:', user?.rol);

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
            // Solo navegar si no es la página actual
            if (page !== "usuarios") {
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
            }
          }}
          currentPage="usuarios"
        />
        <div className="flex-1 flex flex-col">
          <UserManagement currentUser={user} />
        </div>
      </div>
    </FeatureProvider>
  )
}