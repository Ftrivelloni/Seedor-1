"use client"
import { DashboardStats } from "../../components/dashboard-stats"
import { Sidebar } from "../../components/sidebar"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService, type AuthUser } from "../../lib/auth"
import { CampoPage } from "../../components/campo/campo-page"
import { EmpaquePage } from "../../components/empaque/empaque-page"
import { InventarioPage } from "../../components/inventario/inventario-page"
import { FinanzasPage } from "../../components/finanzas/finanzas-page"
import { AjustesPage } from "../../components/ajustes/ajustes-page"
import TrabajadoresPage from "../../components/trabajadores/trabajadores-page"
import ContactosPage from "../../components/contactos/contactos-page"

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Renderiza el componente correspondiente según currentPage
  const renderPageContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardStats />
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
      default:
        return <DashboardStats />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} onLogout={() => { router.push("/login") }} onNavigate={setCurrentPage} currentPage={currentPage} />
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold">{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</h1>
              <p className="text-sm text-muted-foreground">Resumen general de {user.tenant.nombre}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.nombre}</p>
                <p className="text-xs text-muted-foreground">{user.rol}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderPageContent()}
          </div>
        </main>
      </div>
    </div>
  )
}
