"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { Sidebar } from "@/components/sidebar"
import { DashboardStats } from "@/components/dashboard-stats"
import { CampoPage } from "@/components/campo/campo-page"
import { EmpaquePage } from "@/components/empaque/empaque-page"
import { InventarioPage } from "@/components/inventario/inventario-page"
import { FinanzasPage } from "@/components/finanzas/finanzas-page"
import { AjustesPage } from "@/components/ajustes/ajustes-page"
import { authService } from "@/lib/auth"

type CurrentPage = "dashboard" | "campo" | "empaque" | "inventario" | "finanzas" | "ajustes"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<CurrentPage>("dashboard")

  useEffect(() => {
    // Check if user is already authenticated
    const user = authService.getCurrentUser()
    setIsAuthenticated(!!user)
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    await authService.logout()
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  const user = authService.getCurrentUser()
  if (!user) return null

  const getPageTitle = () => {
    switch (currentPage) {
      case "dashboard":
        return "Dashboard"
      case "campo":
        return "Gestión de Campo"
      case "empaque":
        return "Gestión de Empaque"
      case "inventario":
        return "Gestión de Inventario"
      case "finanzas":
        return "Gestión Financiera"
      case "ajustes":
        return "Configuración de Usuario"
      default:
        return "Dashboard"
    }
  }

  const getPageDescription = () => {
    switch (currentPage) {
      case "dashboard":
        return `Resumen general de ${user.tenant.nombre}`
      case "campo":
        return "Administra las tareas y actividades del campo"
      case "empaque":
        return "Registros de procesamiento de fruta"
      case "inventario":
        return "Control de stock e inventario"
      case "finanzas":
        return "Gestión de caja chica y movimientos"
      case "ajustes":
        return "Gestiona tu perfil y configuración personal"
      default:
        return `Resumen general de ${user.tenant.nombre}`
    }
  }

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
      default:
        return <DashboardStats />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} onNavigate={setCurrentPage} currentPage={currentPage} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
              <p className="text-sm text-muted-foreground">{getPageDescription()}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.nombre}</p>
                <p className="text-xs text-muted-foreground">{user.rol}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{renderPageContent()}</div>
        </main>
      </div>
    </div>
  )
}
