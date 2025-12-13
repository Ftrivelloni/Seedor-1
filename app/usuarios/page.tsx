"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "../../components/sidebar"
import { UserManagement } from "../../components/admin/user-management"
import { useAuth } from "../../hooks/use-auth"
import { FeatureProvider } from "../../lib/features-context"

export default function UsuariosRoutePage() {
  // Usar useAuth SIN requireRoles para evitar redirecciones automáticas
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true
  });
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Verificar autorización manualmente después de cargar
  useEffect(() => {
    if (!loading && user) {
      // Verificar si el usuario tiene rol admin
      const hasAdminRole = user.rol?.toLowerCase() === 'admin';
      setIsAuthorized(hasAdminRole);
      
      // Solo redirigir si definitivamente NO tiene acceso
      if (!hasAdminRole) {
        console.log('👤 User does not have admin role, redirecting to home');
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      }
    }
  }, [user, loading, router]);

  // Debug logs
  console.log('👤 Usuarios Page - User:', user?.email, 'Rol:', user?.rol, 'Loading:', loading, 'Authorized:', isAuthorized);

  if (loading || isAuthorized === null) {
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

  // Si no está autorizado, mostrar loading mientras redirige
  if (!isAuthorized) {
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
