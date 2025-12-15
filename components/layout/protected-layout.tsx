"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "../sidebar"
import { FeatureProvider } from "../../lib/features-context"
import { useAuth } from "../../hooks/use-auth"

interface HeaderProps {
  title: string
  subtitle?: string
  user: any
  handleLogout: () => Promise<void>
}

function Header({ title, subtitle, user, handleLogout }: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {subtitle || `${title} - ${user?.tenant?.name || 'Tu Empresa'}`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.rol || 'Usuario'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

interface ProtectedLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  currentPage: string
  requiredRoles?: string[]
}

export function ProtectedLayout({
  children,
  title,
  subtitle,
  currentPage,
  requiredRoles = ["Admin"]
}: ProtectedLayoutProps) {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: requiredRoles
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
      <div className="h-screen bg-background flex overflow-hidden">
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
          currentPage={currentPage} 
        />
        <div className="flex-1 flex flex-col">
          <Header 
            user={user} 
            handleLogout={handleLogout}
            title={title} 
            subtitle={subtitle}
          />
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </FeatureProvider>
  )
}