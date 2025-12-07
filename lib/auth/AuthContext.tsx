'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { authService } from './auth-service';
import { sessionManager } from './session-manager';
import { tokenStorage } from './api-client';
import { AuthUser, SessionUser, TenantMembership } from './types';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setSelectedTenant: (membership: TenantMembership) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        // First check session storage
        const sessionUser = sessionManager.getCurrentUser();

        if (sessionUser && tokenStorage.hasValidToken()) {
          setUser(sessionUser);

          // Optionally refresh user data from API in background
          try {
            const freshUser = await authService.getMe();
            const updatedSession: SessionUser = {
              id: freshUser.id,
              email: freshUser.email,
              tenantId: freshUser.tenantId,
              rol: freshUser.rol,
              nombre: freshUser.nombre,
              tenant: freshUser.tenant,
              profile: freshUser.profile,
              memberships: freshUser.memberships,
              isDemo: false,
            };
            sessionManager.setCurrentUser(updatedSession);
            setUser(updatedSession);
          } catch {
            // Keep using session user if API fails
          }
        } else if (tokenStorage.hasValidToken()) {
          // Have token but no session, try to fetch user
          try {
            const freshUser = await authService.getMe();
            const sessionUser: SessionUser = {
              id: freshUser.id,
              email: freshUser.email,
              tenantId: freshUser.tenantId,
              rol: freshUser.rol,
              nombre: freshUser.nombre,
              tenant: freshUser.tenant,
              profile: freshUser.profile,
              memberships: freshUser.memberships,
              isDemo: false,
            };
            sessionManager.setCurrentUser(sessionUser);
            setUser(sessionUser);
          } catch {
            // Token is invalid, clear it
            tokenStorage.clearTokens();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listen for session updates
    const handleSessionUpdate = () => {
      const latestUser = sessionManager.getCurrentUser();
      setUser(latestUser);
    };

    // Listen for auth errors (401, 403)
    const handleAuthError = (event: CustomEvent<{ status: number }>) => {
      if (event.detail.status === 401) {
        setUser(null);
        // Redirect to login if needed
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    };

    window.addEventListener('seedor:session-updated', handleSessionUpdate);
    window.addEventListener('seedor:auth-error', handleAuthError as EventListener);

    // Subscribe to session manager changes
    const unsubscribe = sessionManager.subscribe(handleSessionUpdate);

    return () => {
      window.removeEventListener('seedor:session-updated', handleSessionUpdate);
      window.removeEventListener('seedor:auth-error', handleAuthError as EventListener);
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const response = await authService.login({ email, password });
    const sessionUser: SessionUser = {
      id: response.user.id,
      email: response.user.email,
      tenantId: response.user.tenantId,
      rol: response.user.rol,
      nombre: response.user.nombre,
      tenant: response.user.tenant,
      profile: response.user.profile,
      memberships: response.user.memberships,
      isDemo: false,
    };
    setUser(sessionUser);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.hasValidToken()) {
      setUser(null);
      return;
    }

    try {
      const freshUser = await authService.getMe();
      const sessionUser: SessionUser = {
        id: freshUser.id,
        email: freshUser.email,
        tenantId: freshUser.tenantId,
        rol: freshUser.rol,
        nombre: freshUser.nombre,
        tenant: freshUser.tenant,
        profile: freshUser.profile,
        memberships: freshUser.memberships,
        isDemo: false,
      };
      sessionManager.setCurrentUser(sessionUser);
      setUser(sessionUser);
    } catch {
      tokenStorage.clearTokens();
      sessionManager.clearCurrentTabSession();
      setUser(null);
    }
  }, []);

  const setSelectedTenant = useCallback((membership: TenantMembership) => {
    if (!user) return;

    const updatedUser: SessionUser = {
      ...user,
      tenantId: membership.tenant_id,
      rol: membership.role_code,
      tenant: membership.tenants || user.tenant,
    };

    sessionManager.setCurrentUser(updatedUser);
    setUser(updatedUser);
  }, [user]);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user && tokenStorage.hasValidToken(),
    login,
    logout,
    refreshUser,
    setSelectedTenant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Compatibility hooks for existing code
export function useUser() {
  const context = useContext(AuthContext);
  return {
    user: context?.user || null,
    loading: context?.loading ?? true,
    setUser: () => {}, // No-op for compatibility
    setSelectedTenant: context?.setSelectedTenant,
  };
}

export function useUserActions() {
  const context = useContext(AuthContext);
  return {
    clearUser: context?.logout || (() => {}),
    setUser: () => {}, // No-op for compatibility
    setSelectedTenant: context?.setSelectedTenant,
  };
}

export { AuthContext };
