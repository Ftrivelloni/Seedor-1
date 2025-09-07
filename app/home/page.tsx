"use client"
import { DashboardStats } from "../../components/dashboard-stats"
import { Sidebar } from "../../components/sidebar"
import { useState } from "react"
import { authService } from "../../lib/auth"

export default function HomePage() {
  const user = authService.getCurrentUser()
  const [currentPage, setCurrentPage] = useState("dashboard")

  if (!user) {
    // Si no está autenticado, redirigir al login
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} onLogout={() => { window.location.href = "/login" }} onNavigate={setCurrentPage} currentPage={currentPage} />
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold">Dashboard</h1>
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
            <DashboardStats />
          </div>
        </main>
      </div>
    </div>
  )
}
