// hooks/use-auth.ts
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useUserActions } from "../components/auth/UserContext";
import { useEmpaqueAuth } from "../components/empaque/EmpaqueAuthContext";
import { authService } from "../lib/supabaseAuth";
import { getSessionManager } from "../lib/sessionManager";

declare global {
  interface Window {
    empaqueLayoutUser?: any;
  }
}


export function useAuth(options: {
  redirectToLogin?: boolean; 
  requireRoles?: string[];   
  useLayoutSession?: boolean; 
} = {}) {
  const { redirectToLogin = true, requireRoles = [], useLayoutSession = false } = options;
  const { user: contextUser, loading: contextLoading } = useUser();
  const { clearUser } = useUserActions();
  const [activeUser, setActiveUser] = useState<any>(null);
  const router = useRouter();
  
  const sessionCheckAttempted = useRef(false);
  const isSubpageUsingLayout = useRef(useLayoutSession);
  
  const [authChecking, setAuthChecking] = useState(true);
  
  const checkAndGetSession = async () => {
    if (sessionCheckAttempted.current) return;
    sessionCheckAttempted.current = true;
    
    try {
      const sessionManager = getSessionManager();
      
      // Primero intentar obtener de la sesión de la pestaña
      let tabUser = sessionManager.getCurrentUser();
      
      if (tabUser) {

        setActiveUser(tabUser);
        setAuthChecking(false);
        return;
      }

      // Si no hay sesión de pestaña, verificar con getSafeSession
      const { user: sessionUser, error } = await authService.getSafeSession();
      
      if (sessionUser) {
        setActiveUser(sessionUser);
        setAuthChecking(false);
        return;
      }
      
      if (error) {
        console.error('Session check error:', error);
      }
      
      setAuthChecking(false);
      
      if (redirectToLogin && !isSubpageUsingLayout.current) {
        // Only redirect to login if we're sure there's no valid session
        // Add a longer delay to allow context and session to load
        setTimeout(() => {
          if (!getParentUser() && !activeUser && !contextUser) {
            router.push("/login");
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error checking session:', err);
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    if (isSubpageUsingLayout.current) {
      setAuthChecking(false);
      return;
    }
    
    const sessionManager = getSessionManager();
    
    // Primero intentar la sesión de la pestaña
    const tabUser = sessionManager.getCurrentUser();
    if (tabUser) {
      setActiveUser(tabUser);
      setAuthChecking(false);
      return;
    }
    
    // Luego el contexto
    if (contextUser) {
      setActiveUser(contextUser);
      setAuthChecking(false);
      return;
    }
    
    // Finalmente verificar sesión
    if (contextLoading || (!contextUser && !tabUser)) {
      checkAndGetSession();
    } else {
      setAuthChecking(false);
    }
  }, [contextUser, contextLoading, router, redirectToLogin]);

  let empaqueUser = null;
  try {
    const empaqueAuth = useEmpaqueAuth();
    empaqueUser = empaqueAuth?.empaqueUser;
  } catch (err) {
    console.warn('Error accessing EmpaqueAuthContext:', err);
  }
  
  const getParentUser = () => {
    if (empaqueUser) {
      return empaqueUser;
    }
    
    if (typeof window !== 'undefined' && window.empaqueLayoutUser) {
      return window.empaqueLayoutUser;
    }
    
    return null;
  };
  
  useEffect(() => {
    if (useLayoutSession && !empaqueUser && !getParentUser() && typeof window !== 'undefined') {
      let attempts = 0;
      const maxAttempts = 15; // Increase max attempts
      const checkInterval = setInterval(() => {
        attempts++;
        
        let latestEmpaqueUser = null;
        try {
          if (typeof window !== 'undefined' && window.empaqueLayoutUser) {
            latestEmpaqueUser = window.empaqueLayoutUser;
          }
        } catch (err) {
          console.error("Error checking for user:", err);
        }
        
        const windowUser = typeof window !== 'undefined' ? window.empaqueLayoutUser : null;
        
        const foundUser = latestEmpaqueUser || windowUser;
        
        if (foundUser) {
          setActiveUser(foundUser);
          setAuthChecking(false);
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          if (contextUser) {
            setActiveUser(contextUser);
          } else {
            checkAndGetSession();
          }
          clearInterval(checkInterval);
        }
      }, 200); 
      
      return () => clearInterval(checkInterval);
    }
  }, [useLayoutSession, contextUser]);
  
  const parentUser = useLayoutSession ? (empaqueUser || getParentUser()) : null;
  const sessionManager = getSessionManager();
  
  // Usar peek para evitar efectos secundarios durante logout
  const tabUser = activeUser ? null : sessionManager.peekCurrentUser();
  
  // Prioridad depende de useLayoutSession:
  // - Si useLayoutSession=true: parentUser (empaque) > activeUser > tabUser > contextUser
  // - Si useLayoutSession=false: activeUser > tabUser > contextUser (IGNORAR parentUser)
  // Esto evita que el usuario de empaque interfiera con otras páginas
  const currentUser = useLayoutSession 
    ? (parentUser || (activeUser === null ? null : (activeUser || tabUser || contextUser)))
    : (activeUser === null ? null : (activeUser || tabUser || contextUser));
  
  const hasRequiredRole = isSubpageUsingLayout.current ? true : (
    !currentUser ? false : (
      requireRoles.length === 0 || 
      requireRoles.some(role => role.toLowerCase() === currentUser.rol?.toLowerCase())
    )
  );
  

  
  useEffect(() => {
    if (isSubpageUsingLayout.current) return;
    
    // Don't do anything while still loading
    if (authChecking || contextLoading) {
      return;
    }
    
    // Don't validate if no user
    if (!currentUser) {
      return;
    }
    
    // Don't validate if no role (user might be logging out)
    if (!currentUser.rol) {
      return;
    }
    
    // Don't validate if no roles required
    if (requireRoles.length === 0) {
      return;
    }
    
    // Check if user has required role
    const userRole = currentUser.rol.toLowerCase();
    const hasValidRole = requireRoles.some(role => role.toLowerCase() === userRole);
    
    // Only redirect if user definitely doesn't have access
    if (!hasValidRole) {
      const redirectTimer = setTimeout(() => {
        // Double-check before redirecting
        if (currentUser && 
            currentUser.rol && 
            !authChecking && 
            !contextLoading &&
            !requireRoles.some(role => role.toLowerCase() === currentUser.rol.toLowerCase())) {
          
          console.log('🔄 User role mismatch, redirecting to home. User role:', currentUser.rol, 'Required:', requireRoles);
          router.replace("/home");
        }
      }, 1000); // Longer delay to allow navigation to complete
      
      return () => clearTimeout(redirectTimer);
    }
  }, [currentUser, hasRequiredRole, requireRoles, router, authChecking, contextLoading]);

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

  if (currentUser && !currentUser.worker) {
    currentUser.worker = {
      id: currentUser.id || 'temp-id',
      full_name: currentUser.nombre || 'Usuario',
      email: currentUser.email,
      tenant_id: currentUser.tenantId || '',
      area_module: currentUser.rol?.toLowerCase() || 'general',
      status: 'active'
    };
  }

  const handleLogout = async () => {

    
    try {
      // Primero limpiar todos los estados locales inmediatamente
      setActiveUser(null);
      clearUser(); // Limpiar también el UserContext
      
      // Limpiar el contexto de ventana
      if (typeof window !== 'undefined') {
        window.empaqueLayoutUser = undefined;
      }
      
      // Luego hacer el logout del servicio
      await authService.logout();
      

      
      // Redirigir inmediatamente
      router.push("/login");
      
    } catch (error) {

      // Aún así redirigir a login si hay error
      router.push("/login");
    }
  };

  return {
    user: currentUser,
    loading: authChecking || contextLoading,
    loggedIn: !!currentUser,
    hasRequiredRole,
    handleLogout
  };
}