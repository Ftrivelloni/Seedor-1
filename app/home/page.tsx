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

  // Función mejorada para manejar el logout
  const onLogout = async () => {
    try {
      console.log('🚪 Home: Iniciando cierre de sesión...');
      await handleLogout();
      console.log('✅ Home: Redirigiendo a login después del cierre de sesión');
    } catch (error) {
      console.error('❌ Home: Error en el cierre de sesión:', error);
      // En caso de error, forzar la redirección
      router.push('/login');
    }
  };

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
  
  // Render the appropriate section based on currentPage
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
          onLogout={onLogout}
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

            // For campo, navigate to the route
            if (page === "campo") {
              router.push("/campo");
            } else if (pageRoutes[page] && pageRoutes[page] !== "/home") {
              // For other pages with dedicated routes, navigate there
              router.push(pageRoutes[page]);
            } else {
              // For pages that render in home, just change the state
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