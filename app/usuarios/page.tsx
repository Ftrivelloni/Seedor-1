"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Sidebar } from "../../components/sidebar"
import { UserManagement } from "../../components/admin/user-management"
import { useAuth } from "../../hooks/use-auth"
import { FeatureProvider } from "../../lib/features-context"

export default function UsuariosRoutePage() {
  const { user, loading, handleLogout, hasRequiredRole } = useAuth({
    redirectToLogin: true,
    requireRoles: ["admin"]
  });
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  // Delay rendering until auth is fully resolved to prevent unwanted redirects
  useEffect(() => {
    if (!loading && user) {
      // Extra delay to ensure auth state is stable
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  // Show loading while auth is resolving
  if (loading || !shouldRender) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // If no user after loading, redirect to login
  if (!user) {
    router.push("/login");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if user has admin role - if not, redirect manually
  if (user.rol?.toLowerCase() !== "admin") {
    router.push("/home");
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
          currentPage="usuarios"
        />
        <div className="flex-1 flex flex-col">
          <UserManagement currentUser={user} />
        </div>
      </div>
    </FeatureProvider>
  )
}