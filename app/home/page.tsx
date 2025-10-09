"use client"
import { DashboardStats } from "../../components/dashboard-stats"
import { Sidebar } from "../../components/sidebar"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/use-auth"
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
        {renderPageContent()}
      </div>
    </FeatureProvider>
  )
}

export default HomePage