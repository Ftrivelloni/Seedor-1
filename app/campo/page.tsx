"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { CampoPage } from "../../components/campo/campo-page";
import { useAuth } from "../../hooks/use-auth";
import { FeatureProvider } from "../../lib/features-context";

export default function CampoRoutePage() {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["Admin", "Campo"]
  });
  const router = useRouter();

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
            };

            const targetRoute = pageRoutes[page] || "/home";
            router.push(targetRoute);
          }} 
          currentPage="campo" 
        />
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card">
            <div className="flex h-16 items-center justify-between px-6">
              <div>
                <h1 className="text-xl font-semibold">Campo</h1>
                <p className="text-sm text-muted-foreground">Gestión de campo y cultivos - {user?.tenant?.name || 'Tu Empresa'}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.rol || 'Usuario'}</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <CampoPage />
            </div>
          </main>
        </div>
      </div>
    </FeatureProvider>
  )
}
