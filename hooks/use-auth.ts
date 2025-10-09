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
    // Reset the flag to allow re-checking if needed
    sessionCheckAttempted.current = true;
    
    try {
      const sessionManager = getSessionManager();
      
      // Primero intentar obtener de la sesión de la pestaña
      let tabUser = sessionManager.getCurrentUser();
      
      if (tabUser) {
        console.log('✅ Session found in tab storage');
        setActiveUser(tabUser);
        setAuthChecking(false);
        return;
      }

      // Si no hay sesión de pestaña, verificar con getSafeSession
      const { user: sessionUser, error } = await authService.getSafeSession();
      
      if (sessionUser) {
        console.log('✅ Session found from authService');
        // Store in session manager to avoid repeated checks
        sessionManager.setCurrentUser(sessionUser);
        setActiveUser(sessionUser);
        setAuthChecking(false);
        return;
      }
      
      if (error) {
        console.error('Session check error:', error);
      }
      
      setAuthChecking(false);
      
      if (redirectToLogin && !isSubpageUsingLayout.current) {
        // Increased delay to ensure all auth checks complete
        setTimeout(() => {
          if (!getParentUser() && !activeUser && !contextUser) {
            console.log('⚠️ No session found, redirecting to login');
            router.push("/login");
          }
        }, 250);
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
  
  // Prioridad: parentUser (empaque) > activeUser (estado local) > tabUser (sessionManager) > contextUser (global)
  // Si activeUser es null explícitamente (logout), solo usar parentUser
  const currentUser = parentUser || (activeUser === null ? null : (activeUser || tabUser || contextUser));
  
  const hasRequiredRole = isSubpageUsingLayout.current ? true : (
    !currentUser ? false : (
      requireRoles.length === 0 || 
      requireRoles.some(role => role.toLowerCase() === currentUser.rol?.toLowerCase())
    )
  );
  

  
  useEffect(() => {
    if (isSubpageUsingLayout.current) return;
    
    if (authChecking || contextLoading) {
      return;
    }
    
    // Si no hay usuario, no hacer validaciones de roles
    if (!currentUser) {
      return;
    }
    
    // Si el usuario no tiene rol, probablemente esté en proceso de logout
    // No hacer validaciones en este caso
    if (!currentUser.rol) {

      return;
    }
    
    // Solo validar roles si hay usuario completo con rol
    // No redirigir si aún se están cargando los datos
    // Agregar condición adicional: solo redirigir si el usuario tiene rol pero no el requerido
    if (requireRoles.length > 0 && 
        !hasRequiredRole && 
        !authChecking && 
        !contextLoading &&
        currentUser && 
        currentUser.rol && // Solo redirigir si ya tiene rol cargado
        !requireRoles.includes(currentUser.rol)) { // Y ese rol no está en los requeridos
      
      console.log('🔄 User role mismatch, redirecting to home. User role:', currentUser.rol, 'Required:', requireRoles);
      router.push("/home");
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