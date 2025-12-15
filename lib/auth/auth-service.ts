import { apiClient, tokenStorage } from './api-client';
import { sessionManager } from './session-manager';
import {
  AuthUser,
  LoginDto,
  LoginResponse,
  SendOtpDto,
  VerifyOtpDto,
  VerifyOtpResponse,
  RegisterTenantDto,
  RegisterTenantResponse,
  InviteUserDto,
  InviteUserResponse,
  AcceptInvitationDto,
  AcceptInvitationResponse,
  Invitation,
  TenantLimits,
  SessionUser,
} from './types';

// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
const SLUG_REGEX = /^[a-z0-9\-]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

function validatePhone(phone: string): boolean {
  if (!phone) return true;
  return PHONE_REGEX.test(phone.trim());
}

function validateSlug(slug: string): boolean {
  const trimmed = slug.trim().toLowerCase();
  return SLUG_REGEX.test(trimmed) && trimmed.length >= 3 && trimmed.length <= 50;
}

function validatePassword(password: string): boolean {
  return password.length >= 6 && password.length <= 128;
}

function validateText(text: string, minLength: number = 1, maxLength: number = 255): boolean {
  const trimmed = text.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

// Exported validators for use in form components
export const validators = {
  email: validateEmail,
  phone: validatePhone,
  slug: validateSlug,
  password: validatePassword,
  text: validateText,
};

class AuthService {
  // ==================== LOGIN ====================

  async login(dto: LoginDto): Promise<LoginResponse> {
    const email = dto.email.trim().toLowerCase();

    if (!validateEmail(email)) {
      throw new Error('Email inválido');
    }

    if (!validatePassword(dto.password)) {
      throw new Error('La contraseña debe tener entre 6 y 128 caracteres');
    }

    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password: dto.password,
    });

    const { user, accessToken } = response.data;

    // Store token
    tokenStorage.setAccessToken(accessToken);

    // Create session user WITHOUT auto-selecting tenantId.
    // User must manually select tenant from dropdown after login.
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      tenantId: '', // Force empty - user must select tenant manually
      rol: user.rol,
      nombre: user.nombre,
      tenant: user.tenant,
      profile: user.profile,
      memberships: user.memberships,
      isDemo: false,
    };

    sessionManager.setCurrentUser(sessionUser);

    return response.data;
  }

  // ==================== OTP VERIFICATION ====================

  async sendOwnerVerificationCode(dto: SendOtpDto): Promise<void> {
    const email = dto.email.trim().toLowerCase();

    if (!validateEmail(email)) {
      throw new Error('Email inválido');
    }

    await apiClient.post('/auth/send-otp', { email });
  }

  async verifyOwnerCode(dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const email = dto.email.trim().toLowerCase();

    if (!validateEmail(email)) {
      throw new Error('Email inválido');
    }

    if (!dto.code || dto.code.length !== 6) {
      throw new Error('El código debe tener 6 dígitos');
    }

    const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', {
      email,
      code: dto.code,
    });

    // Store the token from OTP verification
    tokenStorage.setAccessToken(response.data.accessToken);

    return response.data;
  }

  // ==================== TENANT REGISTRATION ====================

  async createTenantWithOwner(
    dto: RegisterTenantDto,
    userId: string
  ): Promise<RegisterTenantResponse> {
    if (!dto.tenantName || dto.tenantName.trim().length < 2) {
      throw new Error('El nombre de la empresa debe tener al menos 2 caracteres');
    }

    if (!validateSlug(dto.slug)) {
      throw new Error('El identificador debe tener entre 3 y 50 caracteres (solo letras, números y guiones)');
    }

    if (!validateEmail(dto.contactEmail)) {
      throw new Error('Email de contacto inválido');
    }

    if (dto.ownerPhone && !validatePhone(dto.ownerPhone)) {
      throw new Error('Teléfono inválido');
    }

    const response = await apiClient.post<RegisterTenantResponse>('/auth/register-tenant', {
      ...dto,
      userId,
    });

    // Update session with new tenant info
    const currentUser = sessionManager.getCurrentUser();
    if (currentUser) {
      const updatedUser: SessionUser = {
        ...currentUser,
        tenantId: response.data.tenant.id,
        tenant: response.data.tenant,
        rol: 'owner',
        memberships: [
          ...(currentUser.memberships || []),
          response.data.membership,
        ],
      };
      sessionManager.setCurrentUser(updatedUser);
    }

    return response.data;
  }

  // ==================== INVITATIONS ====================

  async inviteUser(dto: InviteUserDto): Promise<InviteUserResponse> {
    const email = dto.email.trim().toLowerCase();

    if (!validateEmail(email)) {
      throw new Error('Email inválido');
    }

    if (!dto.tenantId) {
      throw new Error('Tenant ID requerido');
    }

    const response = await apiClient.post<InviteUserResponse>('/auth/invite', {
      ...dto,
      email,
    });

    return response.data;
  }

  async getInvitationByToken(token: string): Promise<Invitation> {
    if (!token) {
      throw new Error('Token de invitación requerido');
    }

    const response = await apiClient.get<{ invitation: Invitation }>(
      `/auth/invitation/${token}`
    );

    return response.data.invitation;
  }

  async acceptInvitation(dto: AcceptInvitationDto): Promise<AcceptInvitationResponse> {
    if (!dto.token) {
      throw new Error('Token de invitación requerido');
    }

    if (!dto.accessToken) {
      throw new Error('Access token requerido');
    }

    if (dto.password && !validatePassword(dto.password)) {
      throw new Error('La contraseña debe tener entre 6 y 128 caracteres');
    }

    const response = await apiClient.post<AcceptInvitationResponse>(
      '/auth/accept-invitation',
      dto
    );

    // Update session with new membership
    const currentUser = sessionManager.getCurrentUser();
    if (currentUser) {
      const updatedUser: SessionUser = {
        ...currentUser,
        tenantId: response.data.tenantId,
        memberships: [
          ...(currentUser.memberships || []),
          response.data.membership,
        ],
      };
      sessionManager.setCurrentUser(updatedUser);
    }

    return response.data;
  }

  async revokeInvitation(invitationId: string): Promise<void> {
    if (!invitationId) {
      throw new Error('ID de invitación requerido');
    }

    await apiClient.delete(`/auth/invitation/${invitationId}`);
  }

  async getTenantInvitations(tenantId: string): Promise<Invitation[]> {
    if (!tenantId) {
      throw new Error('Tenant ID requerido');
    }

    const response = await apiClient.get<{ invitations: Invitation[] }>(
      `/auth/tenant/${tenantId}/invitations`
    );

    return response.data.invitations;
  }

  // ==================== SESSION / ME ====================

  async getMe(): Promise<AuthUser> {
    const response = await apiClient.get<{ user: AuthUser }>('/auth/me');

    // Update session with fresh user data
    const user = response.data.user;
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

    return user;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // First check session
    const sessionUser = sessionManager.getCurrentUser();

    // If no token, no user
    if (!tokenStorage.hasValidToken()) {
      return null;
    }

    try {
      // Fetch fresh user data from API
      return await this.getMe();
    } catch {
      // If API fails, return session user if available
      if (sessionUser) {
        return {
          id: sessionUser.id,
          email: sessionUser.email,
          nombre: sessionUser.nombre || sessionUser.email,
          tenantId: sessionUser.tenantId,
          rol: sessionUser.rol,
          tenant: sessionUser.tenant || null,
          profile: sessionUser.profile || null,
          memberships: sessionUser.memberships || [],
        };
      }
      return null;
    }
  }

  getSafeSession(): SessionUser | null {
    // Check for valid token first
    if (!tokenStorage.hasValidToken()) {
      return null;
    }

    return sessionManager.getCurrentUser();
  }

  // ==================== TENANT LIMITS ====================

  async getTenantLimits(tenantId: string): Promise<TenantLimits> {
    if (!tenantId) {
      throw new Error('Tenant ID requerido');
    }

    const response = await apiClient.get<{ limits: TenantLimits }>(
      `/auth/tenant/${tenantId}/limits`
    );

    return response.data.limits;
  }

  async canAddField(tenantId: string): Promise<boolean> {
    const limits = await this.getTenantLimits(tenantId);
    return limits.fields.available > 0;
  }

  // ==================== SET PASSWORD ====================

  async setPassword(password: string): Promise<void> {
    await apiClient.post('/auth/set-password', { password });
  }

  // ==================== LOGOUT ====================

  async logout(): Promise<void> {
    try {
      // Try to call logout endpoint
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors, we're logging out anyway
    } finally {
      // Clear local storage
      tokenStorage.clearTokens();
      sessionManager.clearCurrentTabSession();

      // Clear any legacy storage
      if (typeof window !== 'undefined') {
        // Clear Supabase storage
        const keysToRemove = Object.keys(localStorage).filter(
          (key) =>
            key.startsWith('sb-') ||
            key.startsWith('supabase.') ||
            key.startsWith('seedor')
        );
        keysToRemove.forEach((key) => localStorage.removeItem(key));

        // Clear session storage
        const sessionKeysToRemove = Object.keys(sessionStorage).filter(
          (key) => key.startsWith('seedor')
        );
        sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));

        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('seedor:session-updated'));
      }
    }
  }

  // ==================== TENANT SELECTION ====================

  setSelectedTenant(membership: {
    tenant_id: string;
    role_code: string;
    tenants?: { id: string; name: string; slug: string } | null;
  }): void {
    const currentUser = sessionManager.getCurrentUser();
    if (!currentUser) return;

    const updatedUser: SessionUser = {
      ...currentUser,
      tenantId: membership.tenant_id,
      rol: membership.role_code as SessionUser['rol'],
      tenant: membership.tenants
        ? ({
            id: membership.tenants.id,
            name: membership.tenants.name,
            slug: membership.tenants.slug,
          } as SessionUser['tenant'])
        : currentUser.tenant,
    };

    sessionManager.setCurrentUser(updatedUser);
  }

  // ==================== UTILITY METHODS ====================

  isAuthenticated(): boolean {
    return tokenStorage.hasValidToken();
  }

  getAccessToken(): string | null {
    return tokenStorage.getAccessToken();
  }

  /**
   * Validates a token received from URL hash (magic link redirect) through our API.
   * This extracts tokens directly from the URL hash without using Supabase client.
   */
  async validateTokenFromHash(accessToken: string, refreshToken?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      console.log('🔄 Validating token from URL hash via API...');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('❌ Token validation failed:', error);
        return { success: false, error: error.message || 'Token validation failed' };
      }

      const data = await response.json();

      // Store the validated token in our tokenStorage
      tokenStorage.setAccessToken(data.accessToken);
      if (data.refreshToken) {
        tokenStorage.setRefreshToken(data.refreshToken);
      }

      console.log('✅ Token validated and stored successfully');
      return { success: true, user: data.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error validating token';
      console.error('❌ validateTokenFromHash error:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Gets the Supabase access token from either our storage or Supabase's localStorage.
   * This is needed during flows where the user has a Supabase session but we haven't
   * transferred it to our storage yet (e.g., after clicking magic link).
   */
  getSupabaseAccessToken(): string | null {
    // First check our storage
    const ourToken = tokenStorage.getAccessToken();
    if (ourToken) return ourToken;

    // If not found, look in Supabase's localStorage
    if (typeof window === 'undefined') return null;

    // Check custom Supabase storage key first (configured in supabaseClient.ts)
    const customKey = 'seedor-auth';
    const customData = localStorage.getItem(customKey);
    if (customData) {
      try {
        const parsed = JSON.parse(customData);
        if (parsed?.access_token) return parsed.access_token;
        if (parsed?.session?.access_token) return parsed.session.access_token;
      } catch {
        // Continue to check other keys
      }
    }

    // Fallback: check default Supabase keys (sb-<project>-auth-token)
    const supabaseKeys = Object.keys(localStorage).filter(
      (key) => key.startsWith('sb-') && key.includes('-auth-token') && !key.includes('code-verifier')
    );

    for (const key of supabaseKeys) {
      const supabaseData = localStorage.getItem(key);
      if (!supabaseData) continue;

      try {
        const parsed = JSON.parse(supabaseData);
        if (parsed?.access_token) return parsed.access_token;
        if (parsed?.session?.access_token) return parsed.session.access_token;
        if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token;
      } catch {
        continue;
      }
    }

    return null;
  }

  // ==================== LEGACY FORMAT METHODS ====================
  // These methods return { success, data, error } format for backwards compatibility

  async getInvitationByTokenLegacy(token: string): Promise<{ success: boolean; data?: Invitation; error?: string }> {
    try {
      const invitation = await this.getInvitationByToken(token);
      return { success: true, data: invitation };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al obtener invitación' };
    }
  }

  async acceptInvitationSimple(token: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      let accessToken = this.getSupabaseAccessToken();

      // If no token found, try to validate and transfer from Supabase
      if (!accessToken) {
        console.log('🔄 acceptInvitationSimple: No token found, trying to transfer Supabase session...');
        const transferResult = await this.validateAndTransferSupabaseToken();
        if (transferResult.success) {
          accessToken = this.getSupabaseAccessToken();
        }
      }

      if (!accessToken) {
        console.error('❌ acceptInvitationSimple: No access token available after transfer attempt');
        return { success: false, error: 'No hay sesión activa. Por favor, iniciá sesión nuevamente.' };
      }

      console.log('✅ acceptInvitationSimple: Found access token, proceeding with invitation acceptance');
      const result = await this.acceptInvitation({ token, accessToken });
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al aceptar invitación' };
    }
  }

  async acceptInvitationWithSetup(params: {
    token: string;
    userData?: {
      fullName: string;
      password: string;
      phone?: string;
    };
  }): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // First check our tokenStorage directly
      let accessToken = tokenStorage.getAccessToken();
      console.log('🔍 acceptInvitationWithSetup: tokenStorage.getAccessToken():', accessToken ? `found (${accessToken.substring(0, 20)}...)` : 'null');

      // If not in our storage, check Supabase storage locations
      if (!accessToken) {
        accessToken = this.getSupabaseAccessToken();
        console.log('🔍 acceptInvitationWithSetup: getSupabaseAccessToken():', accessToken ? 'found' : 'null');
      }

      // If still no token, try to validate and transfer from Supabase localStorage
      if (!accessToken) {
        console.log('🔄 acceptInvitationWithSetup: No token found, trying to transfer Supabase session...');
        const transferResult = await this.validateAndTransferSupabaseToken();
        if (transferResult.success) {
          accessToken = tokenStorage.getAccessToken();
          console.log('🔍 acceptInvitationWithSetup: After transfer, tokenStorage:', accessToken ? 'found' : 'null');
        }
      }

      if (!accessToken) {
        // Log all localStorage keys for debugging
        if (typeof window !== 'undefined') {
          const allKeys = Object.keys(localStorage);
          console.log('🔍 acceptInvitationWithSetup: All localStorage keys:', allKeys);
          console.log('🔍 acceptInvitationWithSetup: seedor_access_token value:', localStorage.getItem('seedor_access_token'));
        }
        console.error('❌ acceptInvitationWithSetup: No access token available after transfer attempt');
        return { success: false, error: 'No hay sesión activa. Por favor, iniciá sesión nuevamente.' };
      }

      console.log('✅ acceptInvitationWithSetup: Found access token, proceeding with invitation acceptance');
      const result = await this.acceptInvitation({
        token: params.token,
        accessToken,
        password: params.userData?.password,
        fullName: params.userData?.fullName,
        phone: params.userData?.phone,
      });
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al aceptar invitación' };
    }
  }

  async getTenantLimitsLegacy(tenantId: string): Promise<{ success: boolean; data?: TenantLimits; error?: string }> {
    try {
      const limits = await this.getTenantLimits(tenantId);
      return { success: true, data: limits };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al obtener límites' };
    }
  }

  async getSafeSessionLegacy(): Promise<{ user: SessionUser | null }> {
    const user = this.getSafeSession();
    return { user };
  }

  // ==================== SUPABASE TOKEN BRIDGE ====================

  /**
   * Reads the Supabase token from localStorage (set by Supabase magic link)
   * and validates it through our API, then stores it in our tokenStorage.
   * This is needed because when users click magic links from email, Supabase
   * stores the session in its own localStorage format.
   */
  async validateAndTransferSupabaseToken(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    if (typeof window === 'undefined') {
      return { success: false, error: 'No window object' };
    }

    try {
      // Log all localStorage keys for debugging
      const allKeys = Object.keys(localStorage);
      console.log('🔍 All localStorage keys:', allKeys);

      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // First check custom Supabase storage key (configured in supabaseClient.ts)
      const customKey = 'seedor-auth';
      const customData = localStorage.getItem(customKey);
      console.log('🔍 Checking seedor-auth key:', !!customData);

      if (customData) {
        try {
          const parsed = JSON.parse(customData);
          console.log('🔍 Parsed seedor-auth data keys:', Object.keys(parsed));
          if (parsed?.access_token) {
            accessToken = parsed.access_token;
            refreshToken = parsed.refresh_token;
            console.log('✅ Found token in seedor-auth');
          } else if (parsed?.session?.access_token) {
            accessToken = parsed.session.access_token;
            refreshToken = parsed.session.refresh_token;
            console.log('✅ Found token in seedor-auth.session');
          }
        } catch (e) {
          console.log('⚠️ Failed to parse seedor-auth:', e);
        }
      }

      // Fallback: check default Supabase keys (sb-<project>-auth-token)
      if (!accessToken) {
        const supabaseKeys = Object.keys(localStorage).filter(
          (key) => key.startsWith('sb-') && key.includes('-auth-token') && !key.includes('code-verifier')
        );

        console.log('🔍 Found Supabase sb-* keys:', supabaseKeys);

        for (const key of supabaseKeys) {
          const supabaseData = localStorage.getItem(key);
          if (!supabaseData) continue;

          try {
            const parsed = JSON.parse(supabaseData);
            console.log('🔍 Parsed Supabase data for key', key, ':', Object.keys(parsed));

            // Handle different storage formats
            if (parsed?.access_token) {
              accessToken = parsed.access_token;
              refreshToken = parsed.refresh_token;
              break;
            }
            // Some versions store session inside a 'session' property
            if (parsed?.session?.access_token) {
              accessToken = parsed.session.access_token;
              refreshToken = parsed.session.refresh_token;
              break;
            }
            // Or under currentSession
            if (parsed?.currentSession?.access_token) {
              accessToken = parsed.currentSession.access_token;
              refreshToken = parsed.currentSession.refresh_token;
              break;
            }
          } catch {
            continue;
          }
        }
      }

      if (!accessToken) {
        console.log('❌ No access token found in Supabase storage');
        return { success: false, error: 'No Supabase session found' };
      }

      console.log('✅ Found access token, validating...');

      // Validate the token through our API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.message || 'Token validation failed' };
      }

      const data = await response.json();

      // Store the validated token in our tokenStorage
      tokenStorage.setAccessToken(data.accessToken);
      if (data.refreshToken) {
        tokenStorage.setRefreshToken(data.refreshToken);
      }

      return { success: true, user: data.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error validating token';
      return { success: false, error: message };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
