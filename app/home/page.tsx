"use client"
import { DashboardStats } from "../../components/dashboard-stats"
import { Sidebar } from "../../components/sidebar"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { authService, type AuthUser } from "../../lib/supabaseAuth"
import { useUser } from "../../components/auth/UserContext"
import { FeatureProvider } from "../../lib/features-context"
import { CampoPage } from "../../components/campo/campo-page"
import { EmpaquePage } from "../../components/empaque/empaque-page"
import { InventarioPage } from "../../components/inventario/inventario-page"
import { FinanzasPage } from "../../components/finanzas/finanzas-page"
import { AjustesPage } from "../../components/ajustes/ajustes-page"
import TrabajadoresPage from "../../components/trabajadores/trabajadores-page"
import ContactosPage from "../../components/contactos/contactos-page"
import { UserManagement } from "../../components/admin/user-management"

// Use dynamic import with SSR disabled to avoid hydration errors
const HomePage = () => {
  const { user, loading } = useUser()
  const [activeUser, setActiveUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const router = useRouter()
  // Client-side only state
  const [isMounted, setIsMounted] = useState(false)
  
  // This effect runs only on the client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Check if user is available from UserContext or authService
  useEffect(() => {
    // Try to get user from direct authService if UserContext doesn't have it
    if (user) {
      setActiveUser(user);
      return;
    }
    
    const directUser = authService.getCurrentUser();
    if (directUser) {
      setActiveUser(directUser);
      return;
    } 
    
    // If no user in either place, try to get a session
    authService.checkSession().then(sessionUser => {
      if (sessionUser) {
        setActiveUser(sessionUser);
      } else {
        router.push('/login');
      }
    });
  }, [user, router]);

  // Once loading is complete, if no user, redirect to login
  useEffect(() => {
    if (isMounted && !loading && !user && !activeUser) {
      // Check if we can find a user from the authService as a fallback
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        // Found user in authService, no need to redirect
        setActiveUser(currentUser);
      } else {
        // No user found in any source, redirect to login
        router.push("/login");
      }
    }
  }, [loading, user, activeUser, isMounted, router]);

  const currentUser = activeUser || user || null;
  
  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user is available, show a simple error state
  if (!currentUser) {
    // This is an emergency fallback in case the redirect hasn't happened yet
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Dashboard Temporal</h1>
        <p className="mb-4">No se ha podido verificar tu sesión.</p>
        <button 
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Ir al Login
        </button>
      </div>
    );
  }
  
  // Ensure the user has tenant information
  if (!currentUser.tenant) {
    currentUser.tenant = {
      name: 'Tu Empresa',
      id: currentUser.tenantId || '',
      plan: 'enterprise',
      status: 'active',
      created_at: new Date().toISOString(),
      slug: 'empresa'
    };
  }

  // Ensure the user has worker information
  if (!currentUser.worker) {
    currentUser.worker = {
      id: currentUser.id || 'temp-id',
      full_name: currentUser.nombre || 'Usuario',
      email: currentUser.email,
      tenant_id: currentUser.tenantId || '',
      area_module: currentUser.rol?.toLowerCase() || 'general',
      status: 'active'
    };
  }
  
  // Render the appropriate section based on currentPage
  const renderPageContent = () => {
    switch (currentPage) {
      case "campo":
        return <CampoPage />
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
        return <UserManagement currentUser={currentUser} />
      default:
        return <DashboardStats />
    }
  }

  return (
    <FeatureProvider user={currentUser}>
      <div className="min-h-screen bg-background flex">
        <Sidebar 
          user={currentUser} 
          onLogout={() => {
            authService.logout();
            router.push("/login");
          }} 
          onNavigate={(page) => setCurrentPage(page)}
          currentPage={currentPage}
        />
        {renderPageContent()}
      </div>
    </FeatureProvider>
  )
}

export default HomePage