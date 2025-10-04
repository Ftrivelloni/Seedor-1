"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "../../components/sidebar"
import { useUser } from "../../components/auth/UserContext"
import { FeatureProvider } from "../../lib/features-context"
import { EmpaqueAuthProvider, useEmpaqueAuth } from "../../components/empaque/EmpaqueAuthContext"
import { useState, useEffect } from "react"
import { authService } from "../../lib/supabaseAuth"

export default function EmpaqueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useUser()
  const [activeUser, setActiveUser] = useState<any>(null)
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false)
  const router = useRouter()

  // Check if user is available from UserContext or authService
  useEffect(() => {
    async function checkAuth() {
      // Try to get user from direct authService if UserContext doesn't have it
      if (user) {
        setActiveUser(user);
        setIsAuthCheckComplete(true);
        return;
      }
      
      const directUser = authService.getCurrentUser();
      if (directUser) {
        console.log('✅ EmpaqueLayout: Found user in authService:', directUser.email);
        setActiveUser(directUser);
        setIsAuthCheckComplete(true);
        return;
      } 
      
      // If no user in either place, try to get a session
      console.log('🔄 EmpaqueLayout: No immediate user found, checking session...');
      try {
        console.log('🔍 DEBUG - EmpaqueLayout: Calling getSafeSession');
        const { user: sessionUser, error } = await authService.getSafeSession();
        console.log('🔍 DEBUG - EmpaqueLayout: getSafeSession result:', { 
          hasUser: !!sessionUser, 
          error: error || 'none',
          userEmail: sessionUser?.email
        });
        
        if (sessionUser) {
          console.log('✅ EmpaqueLayout: Found user in session:', sessionUser.email);
          setActiveUser(sessionUser);
        } else {
          console.log('🚨 EmpaqueLayout: No user found in UserContext, authService or session');
          console.log('🔍 DEBUG - EmpaqueLayout: Redirecting to /login');
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      } finally {
        setIsAuthCheckComplete(true);
      }
    }
    
    checkAuth();
  }, [user, router, loading]);

  // Get the user from all sources
  const currentUser = activeUser || user || authService.getCurrentUser();
  
  // Check if user has required role for Empaque module
  useEffect(() => {
    if (!isAuthCheckComplete || !currentUser) return;
    
    const requiredRoles = ["Admin", "Empaque"];
    const hasRequiredRole = requiredRoles.includes(currentUser.rol);
    
    console.log('🔐 EmpaqueLayout - Role Check:', {
      userEmail: currentUser.email,
      userRole: currentUser.rol,
      requiredRoles: requiredRoles,
      hasAccess: hasRequiredRole
    });
    
    if (!hasRequiredRole) {
      console.error('⚠️ EmpaqueLayout: User does not have required role for Empaque module');
      console.error('Redirecting to /home');
      router.push("/home");
    }
  }, [currentUser, isAuthCheckComplete, router]);
  
  // Share the authenticated user with child components
  useEffect(() => {    
    if (currentUser && typeof window !== 'undefined') {
      // Set immediately first
      window.empaqueLayoutUser = currentUser;
      
      // Then also set with a delay to ensure it persists
      setTimeout(() => {
        window.empaqueLayoutUser = currentUser;
      }, 0);
    }
    
    return () => {
      // Clean up when component unmounts
      if (typeof window !== 'undefined') {
        window.empaqueLayoutUser = undefined;
      }
    };
  }, [currentUser, isAuthCheckComplete]);
  
  if ((loading && !isAuthCheckComplete) || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Add fallback tenant name if needed
  if (currentUser && !currentUser.tenant) {
    currentUser.tenant = {
      name: 'Tu Empresa',
      id: currentUser.tenantId || '',
      plan: 'enterprise',
      status: 'active',
      created_at: new Date().toISOString(),
      slug: 'empresa'
    };
  }

  // Set the user in window immediately for backward compatibility
  if (currentUser && typeof window !== 'undefined') {
    window.empaqueLayoutUser = currentUser;
  }
  
  // Wrap the entire layout with our EmpaqueAuthProvider and pass user via props
  return (
    <EmpaqueAuthProvider initialUser={currentUser}>
      <EmpaqueLayoutContent 
        user={currentUser} 
        isAuthCheckComplete={isAuthCheckComplete}
        loading={loading}
        setActiveUser={setActiveUser}
      >
        {children}
      </EmpaqueLayoutContent>
    </EmpaqueAuthProvider>
  );
}

// Separate the content to a sub-component that can access the EmpaqueAuthContext
function EmpaqueLayoutContent({
  user,
  isAuthCheckComplete,
  loading,
  setActiveUser,
  children
}: {
  user: any;
  isAuthCheckComplete: boolean;
  loading: boolean;
  setActiveUser: (user: any) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setEmpaqueUser } = useEmpaqueAuth();
  
  // Share the authenticated user with child components via context
  useEffect(() => {
    if (user) {
      // Set immediately
      setEmpaqueUser(user);
      
      // Also set with a short delay to ensure it persists in React's render cycle
      setTimeout(() => {
        setEmpaqueUser(user);
      }, 50);
    }
  }, [user, isAuthCheckComplete, setEmpaqueUser]);

  return (
    <FeatureProvider user={user}>
      <div className="min-h-screen bg-background flex">
        <Sidebar 
          user={user} 
          onLogout={() => { 
            authService.logout();
            setActiveUser(null);
            setEmpaqueUser(null);
            if (typeof window !== 'undefined') {
              window.empaqueLayoutUser = undefined;
            }
            router.push("/login");
          }} 
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
              usuarios: "/home", // Redirect usuarios to home page with usuarios tab
              contactos: "/contactos",
            };

            const targetRoute = pageRoutes[page] || "/home";
            if (page === "usuarios") {
              // Special handling for usuarios - navigate to home with usuarios state
              router.push("/home?tab=usuarios");
            } else {
              router.push(targetRoute);
            }
          }} 
          currentPage="empaque" 
        />
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card">
            <div className="flex h-16 items-center justify-between px-6">
              <div>
                <h1 className="text-xl font-semibold">Empaque</h1>
                <p className="text-sm text-muted-foreground">Gestión de empaque y procesamiento - {user?.tenant?.name || 'Tu Empresa'}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.rol || 'Usuario'}</p>
                </div>
              </div>
            </div>
          </header>
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