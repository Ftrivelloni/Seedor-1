"use client"
import { DashboardStats } from "../../components/dashboard-stats"
import { Sidebar } from "../../components/sidebar"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/use-auth"
import { useIsMobile } from "../../hooks/use-mobile"
import { FeatureProvider } from "../../lib/features-context"
import { EmpaquePage } from "../../components/empaque/empaque-page"
import { InventarioPage } from "../../components/inventario/inventario-page"
import { FinanzasPage } from "../../components/finanzas/finanzas-page"
import { AjustesPage } from "../../components/ajustes/ajustes-page"
import TrabajadoresPage from "../../components/trabajadores/trabajadores-page"
import ContactosPage from "../../components/contactos/contactos-page"
import { UserManagement } from "../../components/admin/user-management"

const HomePage = () => {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true
  });
  const [currentPage, setCurrentPage] = useState("dashboard")
  const router = useRouter()
  const isMobile = useIsMobile()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const renderPageContent = () => {
    // If no tenant selected, show selection prompt
    if (!user.tenantId || user.tenantId === '') {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Selecciona un perfil</h2>
            <p className="text-muted-foreground mb-6">
              Elegí el perfil correspondiente arriba para ver el dashboard y acceder a todos los módulos
            </p>
          </div>
        </div>
      )
    }
    
    switch (currentPage) {
      case "empaque":
        return <EmpaquePage />
      case "inventario":
        return <InventarioPage />
      case "finanzas":
        return <FinanzasPage />
      case "ajustes":
        return <AjustesPage />
      case "trabajadores":
        return <TrabajadoresPage />
      case "contactos":
        return <ContactosPage />
      case "usuarios":
        return <UserManagement currentUser={user} />
      default:
        return <DashboardStats />
    }
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
            };

            if (page === "campo") {
              router.push("/campo");
            } else if (pageRoutes[page] && pageRoutes[page] !== "/home") {
              router.push(pageRoutes[page]);
            } else {
              setCurrentPage(page);
            }
          }}
          currentPage={currentPage}
        />
        <main className={isMobile ? "flex-1 pt-14 pb-20 overflow-auto" : "flex-1 overflow-auto"}>
          {renderPageContent()}
        </main>
      </div>
    </FeatureProvider>
  )
}

export default HomePage