"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { useAuth } from "../../hooks/use-auth"
import { FeatureProvider } from "../../lib/features-context"
import { EmpaqueAuthProvider, useEmpaqueAuth } from "../../components/empaque/EmpaqueAuthContext"
import { useEffect } from "react"

export default function EmpaqueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["admin", "empaque"]
  });
  const router = useRouter();

  console.log('� Empaque Layout - User:', user?.email, 'Rol:', user?.rol, 'Loading:', loading);

  useEffect(() => {    
    if (user && typeof window !== 'undefined') {
      window.empaqueLayoutUser = user;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.empaqueLayoutUser = undefined;
      }
    };
  }, [user]);
  
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
    <EmpaqueAuthProvider initialUser={user}>
      <EmpaqueLayoutContent user={user} handleLogout={handleLogout}>
        {children}
      </EmpaqueLayoutContent>
    </EmpaqueAuthProvider>
  );
}

function EmpaqueLayoutContent({
  user,
  handleLogout,
  children
}: {
  user: any;
  handleLogout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setEmpaqueUser } = useEmpaqueAuth();
  
  useEffect(() => {
    if (user) {
      setEmpaqueUser(user);
    }
  }, [user, setEmpaqueUser]);

  const handleLogoutClick = async () => {
    setEmpaqueUser(null);
    if (typeof window !== 'undefined') {
      window.empaqueLayoutUser = undefined;
    }
    await handleLogout();
  };

  return (
    <FeatureProvider user={user}>
      <div className="min-h-screen bg-background flex">
        <Sidebar 
          user={user} 
          onLogout={handleLogoutClick}
          onNavigate={(page) => {
            const pageRoutes: Record<string, string> = {
              dashboard: "/home",
              campo: "/campo",
              empaque: "/empaque",
              inventario: "/inventario",
              finanzas: "/finanzas",
              ajustes: "/ajustes",
              trabajadores: "/trabajadores",
              usuarios: "/usuarios",
              contactos: "/contactos",
            };

            const targetRoute = pageRoutes[page] || "/home";
            router.push(targetRoute);
          }} 
          currentPage="empaque" 
        />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </FeatureProvider>
  )
}