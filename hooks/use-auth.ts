// hooks/use-auth.ts
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../components/auth/UserContext";
import { useEmpaqueAuth } from "../components/empaque/EmpaqueAuthContext";
import { authService } from "../lib/supabaseAuth";

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
  const [activeUser, setActiveUser] = useState<any>(null);
  const router = useRouter();
  
  const sessionCheckAttempted = useRef(false);
  const isSubpageUsingLayout = useRef(useLayoutSession);
  
  const [authChecking, setAuthChecking] = useState(true);
  
  const checkAndGetSession = async () => {
    if (sessionCheckAttempted.current) return;
    sessionCheckAttempted.current = true;
    
    try {
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
        setTimeout(() => {
          if (!getParentUser() && !activeUser && !contextUser && !authService.getCurrentUser()) {
            router.push("/login");
          }
        }, 100);
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
    
    if (contextUser) {
      setActiveUser(contextUser);
      setAuthChecking(false);
      return;
    }
    
    const directUser = authService.getCurrentUser();
    if (directUser) {
      setActiveUser(directUser);
      setAuthChecking(false);
      return;
    }
    
    if (contextLoading || (!contextUser && !directUser)) {
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
          } else if (authService.getCurrentUser()) {
            setActiveUser(authService.getCurrentUser());
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
  const currentUser = parentUser || activeUser || contextUser || authService.getCurrentUser();
  
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
    
    if (currentUser && currentUser.rol && requireRoles.length > 0 && !hasRequiredRole) {
      console.error('⚠️⚠️⚠️ REDIRECTING TO /HOME - User does not have required role');
      console.error('Current user:', {
        email: currentUser.email,
        rol: currentUser.rol,
        tenantId: currentUser.tenantId
      });
      console.error('Required roles:', requireRoles);
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
    await authService.logout();
    setActiveUser(null);
    if (typeof window !== 'undefined') {
      window.empaqueLayoutUser = undefined;
    }
    router.push("/login");
  };

  return {
    user: currentUser,
    loading: authChecking || contextLoading,
    loggedIn: !!currentUser,
    hasRequiredRole,
    handleLogout
  };
}