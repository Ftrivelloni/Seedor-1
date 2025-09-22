"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { useUser } from "../../components/auth/UserContext"
import ContactosPage from "../../components/contactos/contactos-page";

export default function ContactosRoutePage() {
  const { user, loading } = useUser()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        user={user} 
        onLogout={() => { router.push("/login") }} 
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
        currentPage="contactos" 
      />
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold">Contactos</h1>
              <p className="text-sm text-muted-foreground">Gestión de contactos y clientes - {user.tenant.name}</p>
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
            <ContactosPage />
          </div>
        </main>
      </div>
    </div>
  )
}
