// hooks/use-auth.ts
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../components/auth/UserContext";
import { useEmpaqueAuth } from "../components/empaque/EmpaqueAuthContext";
import { authService } from "../lib/supabaseAuth";

// Define a type for the window with our custom property
declare global {
  interface Window {
    empaqueLayoutUser?: any;
  }
}

/**
 * A custom hook that provides robust user authentication from multiple sources.
 * This hook handles authentication by checking:
 * 1. The UserContext
 * 2. Direct authService.getCurrentUser()
 * 3. Session check via authService.checkSession()
 * 
 * @param options Configuration options
 * @returns Authentication state and utilities
 */
export function useAuth(options: {
  redirectToLogin?: boolean; // Whether to redirect to login if no user found
  requireRoles?: string[];   // Required roles to access the page
  useLayoutSession?: boolean; // Whether to use EmpaqueLayout's session (for subpages)
} = {}) {
  const { redirectToLogin = true, requireRoles = [], useLayoutSession = false } = options;
  const { user: contextUser, loading: contextLoading } = useUser();
  const [activeUser, setActiveUser] = useState<any>(null);
  const router = useRouter();
  
  // Track if we've tried to check session to avoid double checks
  const sessionCheckAttempted = useRef(false);
  // Track if this is a subpage using layout authentication
  const isSubpageUsingLayout = useRef(useLayoutSession);
  
  // Track if we're still checking authentication
  const [authChecking, setAuthChecking] = useState(true);
  
  // Try to get the session
  const checkAndGetSession = async () => {
    // Avoid multiple session checks
    if (sessionCheckAttempted.current) return;
    sessionCheckAttempted.current = true;
    
    try {
      // Use getSafeSession for better error handling
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
      
      // Only redirect if:
      // 1. redirectToLogin is true
      // 2. This isn't a subpage relying on layout auth
      // 3. We're not inside a layout component (detected by having children in the window)
      if (redirectToLogin && !isSubpageUsingLayout.current) {
        // Add a short delay to allow parent layouts to handle auth if needed
        setTimeout(() => {
          // Double-check we still don't have a user before redirecting
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
    // Skip immediate auth checks for subpages that rely on layout auth
    if (isSubpageUsingLayout.current) {
      setAuthChecking(false);
      return;
    }
    
    // Priority 1: User from context (provided by UserContext)
    if (contextUser) {
      setActiveUser(contextUser);
      setAuthChecking(false);
      return;
    }
    
    // Priority 2: Direct user from auth service cache
    const directUser = authService.getCurrentUser();
    if (directUser) {
      setActiveUser(directUser);
      setAuthChecking(false);
      return;
    }
    
    // Priority 3: Check for active session if still loading or no user found
    if (contextLoading || (!contextUser && !directUser)) {
      checkAndGetSession();
    } else {
      setAuthChecking(false);
    }
  }, [contextUser, contextLoading, router, redirectToLogin]);

  // Try to get user from EmpaqueAuth context first, then fall back to window global
  // Use try-catch to handle cases where the context isn't available yet
  let empaqueUser = null;
  try {
    const empaqueAuth = useEmpaqueAuth();
    empaqueUser = empaqueAuth?.empaqueUser;
  } catch (err) {
    console.warn('Error accessing EmpaqueAuthContext:', err);
  }
  
  const getParentUser = () => {
    // First check the React context
    if (empaqueUser) {
      return empaqueUser;
    }
    
    // Fall back to window global for backward compatibility
    if (typeof window !== 'undefined' && window.empaqueLayoutUser) {
      return window.empaqueLayoutUser;
    }
    
    return null;
  };
  
  // For layout sessions, keep checking for parent user if not immediately available
  useEffect(() => {
    // Only needed if we don't have empaqueUser from the context
    if (useLayoutSession && !empaqueUser && !getParentUser() && typeof window !== 'undefined') {
      let attempts = 0;
      const maxAttempts = 15; // Increase max attempts
      const checkInterval = setInterval(() => {
        attempts++;
        
        // We can't call hooks inside this callback, so just check the window
        let latestEmpaqueUser = null;
        try {
          // Only access window here, not calling the hook again
          if (typeof window !== 'undefined' && window.empaqueLayoutUser) {
            latestEmpaqueUser = window.empaqueLayoutUser;
          }
        } catch (err) {
          console.error("Error checking for user:", err);
        }
        
        // Also check window directly
        const windowUser = typeof window !== 'undefined' ? window.empaqueLayoutUser : null;
        
        // Check both context and window
        const foundUser = latestEmpaqueUser || windowUser;
        
        if (foundUser) {
          setActiveUser(foundUser);
          setAuthChecking(false);
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          // If we failed to find the parent user, fall back to normal auth flow
          if (contextUser) {
            setActiveUser(contextUser);
          } else if (authService.getCurrentUser()) {
            setActiveUser(authService.getCurrentUser());
          } else {
            checkAndGetSession();
          }
          clearInterval(checkInterval);
        }
      }, 200); // Keep longer interval time
      
      return () => clearInterval(checkInterval);
    }
  }, [useLayoutSession, contextUser]);
  
  const parentUser = useLayoutSession ? (empaqueUser || getParentUser()) : null;
  const currentUser = parentUser || activeUser || contextUser || authService.getCurrentUser();
  
  // Check role-based access if required
  const hasRequiredRole = currentUser && (
    requireRoles.length === 0 || // No specific roles required
    requireRoles.includes(currentUser.rol)
  );
  
  // Debug role checking
  if (requireRoles.length > 0 && currentUser) {
    console.log('🔐 Role Check:', {
      userRole: currentUser.rol,
      requiredRoles: requireRoles,
      hasAccess: hasRequiredRole,
      redirecting: !hasRequiredRole
    });
  }
  
  // Redirect if user doesn't have required role
  useEffect(() => {
    // Skip for subpages using layout auth since parent layout will handle this
    if (isSubpageUsingLayout.current) return;
    
    if (currentUser && requireRoles.length > 0 && !hasRequiredRole) {
      console.warn('⚠️ User does not have required role, redirecting to /home');
      router.push("/home");
    }
  }, [currentUser, hasRequiredRole, requireRoles, router]);

  // Ensure tenant information exists
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

  // Ensure worker information exists
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

  // Logout handler
  const handleLogout = async () => {
    await authService.logout();
    setActiveUser(null);
    // Clear parent reference if it exists
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