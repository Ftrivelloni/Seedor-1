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
    requireRoles: ["Admin", "Empaque"]
  });
  const router = useRouter();

  // Debug logs
  console.log('� Empaque Layout - User:', user?.email, 'Rol:', user?.rol, 'Loading:', loading);

  // Share the authenticated user with child components via window
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
  
  // Wrap the entire layout with our EmpaqueAuthProvider and pass user via props
  return (
    <EmpaqueAuthProvider initialUser={user}>
      <EmpaqueLayoutContent user={user} handleLogout={handleLogout}>
        {children}
      </EmpaqueLayoutContent>
    </EmpaqueAuthProvider>
  );
}

// Separate the content to a sub-component that can access the EmpaqueAuthContext
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
  
  // Share the authenticated user with child components via context
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
            // Map page names to their correct routes
            const pageRoutes: Record<string, string> = {
              dashboard: "/home",
              campo: "/campo",
              empaque: "/empaque",
              inventario: "/inventario",
              finanzas: "/finanzas",
              ajustes: "/ajustes",
              trabajadores: "/trabajadores",
              usuarios: "/home",
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