// hooks/use-auth.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, sessionManager, tokenStorage, CurrentUser, SessionUser, RoleCode } from '../lib/auth';

declare global {
  interface Window {
    empaqueLayoutUser?: SessionUser;
    __SEEDOR_DEMO_ACTIVE?: boolean;
  }
}

interface UseAuthOptions {
  redirectToLogin?: boolean;
  requireRoles?: string[];
  useLayoutSession?: boolean;
}

interface UseAuthReturn {
  user: CurrentUser | null;
  loading: boolean;
  loggedIn: boolean;
  hasRequiredRole: boolean;
  handleLogout: () => Promise<void>;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    redirectToLogin = true,
    requireRoles = [],
    useLayoutSession = false,
  } = options;

  const router = useRouter();
  const [activeUser, setActiveUser] = useState<SessionUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const sessionCheckAttempted = useRef(false);
  const isSubpageUsingLayout = useRef(useLayoutSession);
  const initialLoadComplete = useRef(false);

  // Get user from empaque layout context if available
  const getParentUser = useCallback((): SessionUser | null => {
    if (typeof window !== 'undefined' && window.empaqueLayoutUser) {
      return window.empaqueLayoutUser;
    }
    return null;
  }, []);

  // Check session and set user
  const checkAndGetSession = useCallback(async () => {
    if (sessionCheckAttempted.current) return;
    sessionCheckAttempted.current = true;

    try {
      // First check session storage
      const tabUser = sessionManager.getCurrentUser();

      if (tabUser && tokenStorage.hasValidToken()) {
        setActiveUser(tabUser);
        setAuthChecking(false);
        initialLoadComplete.current = true;
        return;
      }

      // Check if we have a valid token but no session
      if (tokenStorage.hasValidToken()) {
        try {
          const user = await authService.getMe();
          const sessionUser: SessionUser = {
            id: user.id,
            email: user.email,
            tenantId: user.tenantId,
            rol: user.rol,
            nombre: user.nombre,
            tenant: user.tenant,
            profile: user.profile,
            memberships: user.memberships,
            isDemo: false,
          };
          sessionManager.setCurrentUser(sessionUser);
          setActiveUser(sessionUser);
          setAuthChecking(false);
          initialLoadComplete.current = true;
          return;
        } catch {
          // Token is invalid, clear it
          tokenStorage.clearTokens();
          sessionManager.clearCurrentTabSession();
        }
      }

      setAuthChecking(false);
      initialLoadComplete.current = true;

      // Redirect to login if needed
      if (redirectToLogin && !isSubpageUsingLayout.current) {
        const delay = requireRoles.length > 0 ? 1500 : 500;
        setTimeout(() => {
          const parentUser = getParentUser();
          const currentTabUser = sessionManager.getCurrentUser();
          if (!parentUser && !currentTabUser) {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            router.push(`/login?next=${encodeURIComponent(currentPath)}`);
          }
        }, delay);
      }
    } catch (err) {
      console.error('Error checking session:', err);
      setAuthChecking(false);
      initialLoadComplete.current = true;
    }
  }, [redirectToLogin, requireRoles.length, router, getParentUser]);

  // Initial load effect
  useEffect(() => {
    if (isSubpageUsingLayout.current) {
      setAuthChecking(false);
      initialLoadComplete.current = true;
      return;
    }

    // First check session storage
    const tabUser = sessionManager.getCurrentUser();
    if (tabUser && tokenStorage.hasValidToken()) {
      setActiveUser(tabUser);
      setAuthChecking(false);
      initialLoadComplete.current = true;
      return;
    }

    // Then check for valid token
    checkAndGetSession();
  }, [checkAndGetSession]);

  // Listen for session updates
  useEffect(() => {
    const handleSessionUpdate = () => {
      const latestUser = sessionManager.getCurrentUser();
      setActiveUser(latestUser);
    };

    window.addEventListener('seedor:session-updated', handleSessionUpdate);

    const unsubscribe = sessionManager.subscribe(handleSessionUpdate);

    return () => {
      window.removeEventListener('seedor:session-updated', handleSessionUpdate);
      unsubscribe();
    };
  }, []);

  // Handle layout session for empaque module
  useEffect(() => {
    if (!useLayoutSession) return;

    const parentUser = getParentUser();
    if (parentUser) {
      setActiveUser(parentUser);
      setAuthChecking(false);
      return;
    }

    // Poll for parent user if not available immediately
    let attempts = 0;
    const maxAttempts = 15;
    const checkInterval = setInterval(() => {
      attempts++;
      const foundUser = getParentUser();

      if (foundUser) {
        setActiveUser(foundUser);
        setAuthChecking(false);
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        // Fallback to session check
        checkAndGetSession();
        clearInterval(checkInterval);
      }
    }, 200);

    return () => clearInterval(checkInterval);
  }, [useLayoutSession, getParentUser, checkAndGetSession]);

  // Determine current user with priority
  const parentUser = useLayoutSession ? getParentUser() : null;
  const tabUser = sessionManager.getCurrentUser();

  // Priority: parentUser (if useLayoutSession) > activeUser > tabUser
  const currentUser: CurrentUser | null = useLayoutSession
    ? parentUser || activeUser || tabUser
    : activeUser || tabUser;

  // Check if user has required role
  const hasRequiredRole = isSubpageUsingLayout.current
    ? true
    : !currentUser
    ? false
    : requireRoles.length === 0 ||
      requireRoles.some(
        (role) => role.toLowerCase() === currentUser.rol?.toLowerCase()
      );

  // Role validation effect
  useEffect(() => {
    if (isSubpageUsingLayout.current) return;
    if (authChecking) return;
    if (!initialLoadComplete.current) return;
    if (!currentUser || !currentUser.rol) return;
    if (requireRoles.length === 0) return;

    const userRole = currentUser.rol.toLowerCase();
    const hasValidRole = requireRoles.some(
      (role) => role.toLowerCase() === userRole
    );

    if (!hasValidRole && sessionCheckAttempted.current && initialLoadComplete.current) {
      const redirectTimer = setTimeout(() => {
        // Final verification before redirecting
        const finalUser = sessionManager.getCurrentUser();
        if (
          finalUser &&
          finalUser.rol &&
          !requireRoles.some(
            (role) => role.toLowerCase() === finalUser.rol?.toLowerCase()
          )
        ) {
          router.replace('/home');
        }
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, [currentUser, requireRoles, router, authChecking]);

  // Add default tenant and worker if missing
  const enrichedUser: CurrentUser | null = currentUser
    ? {
        ...currentUser,
        tenant: currentUser.tenant || {
          id: currentUser.tenantId || '',
          name: 'Tu Empresa',
          slug: 'empresa',
          plan: 'enterprise',
          contact_name: '',
          contact_email: '',
          created_by: '',
          max_users: 10,
          max_fields: 10,
          current_users: 0,
          current_fields: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        worker: currentUser.worker || {
          id: currentUser.id || 'temp-id',
          fullName: currentUser.nombre || 'Usuario',
          email: currentUser.email,
          role: currentUser.rol as RoleCode | null,
          tenantId: currentUser.tenantId || null,
        },
      }
    : null;

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      // Clear local state immediately
      setActiveUser(null);

      // Clear window context
      if (typeof window !== 'undefined') {
        window.empaqueLayoutUser = undefined;
      }

      // Perform logout
      await authService.logout();

      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login on error
      router.push('/login');
    }
  }, [router]);

  return {
    user: enrichedUser,
    loading: authChecking,
    loggedIn: !!currentUser && tokenStorage.hasValidToken(),
    hasRequiredRole,
    handleLogout,
  };
}
