"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { UserManagement } from "../../components/admin/user-management"
import { useAuth } from "../../hooks/use-auth"
import { FeatureProvider } from "../../lib/features-context"
import { useEffect } from "react"

export default function UsuariosRoutePage() {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["admin"]
  });
  const router = useRouter();
  
  // Force a session check on mount
  useEffect(() => {
    // This ensures the session check is performed
    const checkSession = async () => {
      // This is just to trigger the session check in useAuth
      if (typeof window !== 'undefined') {
        const sessionData = sessionStorage.getItem('seedor_tab_session');
        if (!sessionData && !user && !loading) {
          // If no session found, manually refresh once
          router.refresh();
        }
      }
    };
    
    checkSession();
  }, [router, user, loading]);

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

            // Update session activity timestamp before navigation
            if (typeof sessionStorage !== 'undefined') {
              const sessionData = sessionStorage.getItem('seedor_tab_session');
              if (sessionData) {
                try {
                  const parsed = JSON.parse(sessionData);
                  parsed.lastActivity = Date.now();
                  sessionStorage.setItem('seedor_tab_session', JSON.stringify(parsed));
                } catch (e) {
                  console.error('Error updating session activity:', e);
                }
              }
            }

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