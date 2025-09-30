import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create client for regular operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client if service role key is available
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  primary_crop: string;
  contact_email: string;
  created_by: string;
  created_at: string;
}

export interface Worker {
  id: string;
  tenant_id: string;
  full_name: string;
  document_id: string;
  email: string;
  phone: string;
  area_module: string;
  membership_id: string;
  status: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  tenantId: string;
  rol: string;
  activo: boolean;
  tenant: Tenant;
  worker: Worker;
}

class SupabaseAuthService {
  private currentUser: AuthUser | null = null;
  private isCheckingSession: boolean = false;

  async login(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: "No se pudo autenticar el usuario" };
      }

      // Get worker profile with tenant info
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('email', email)
        .eq('status', 'active')
        .single();

      if (workerError || !worker) {
        return { user: null, error: "Usuario no encontrado o inactivo" };
      }

      const authUser: AuthUser = {
        id: authData.user.id,
        email: worker.email,
        nombre: worker.full_name,
        tenantId: worker.tenant_id,
        rol: this.mapAreaModuleToRole(worker.area_module),
        activo: worker.status === 'active',
        tenant: worker.tenant,
        worker: worker,
      };

      this.currentUser = authUser;
      
      // Update last access time
      await supabase
        .from('workers')
        .update({ last_access: new Date().toISOString() })
        .eq('id', worker.id);

      return { user: authUser, error: null };

    } catch (error: any) {
      return { user: null, error: error.message || "Error inesperado durante el login" };
    }
  }

  private mapAreaModuleToRole(areaModule: string): string {
    const roleMap: { [key: string]: string } = {
      'administracion': 'Admin',
      'administración': 'Admin',
      'admin': 'Admin',
      'campo': 'Campo',
      'empaque': 'Empaque',
      'finanzas': 'Finanzas',
      'general': 'Admin',
      // English variations
      'administration': 'Admin',
      'field': 'Campo',
      'packaging': 'Empaque',
      'finance': 'Finanzas'
    };
    
    const normalizedKey = areaModule.toLowerCase().trim();
    const mappedRole = roleMap[normalizedKey] || 'Campo';
    
    console.log(`Role mapping: "${areaModule}" -> "${normalizedKey}" -> "${mappedRole}"`);
    return mappedRole;
  }

  async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      this.currentUser = null;
      return { error: error?.message || null };
    } catch (error: any) {
      return { error: error.message || "Error inesperado durante el logout" };
    }
  }

  async checkSession(): Promise<AuthUser | null> {
    // Prevent concurrent session checks
    if (this.isCheckingSession) {
      console.log('Session check already in progress, returning current user')
      return this.currentUser;
    }
    
    this.isCheckingSession = true;
    
    try {
      console.log('Starting checkSession...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        // Handle specific refresh token errors
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('Refresh Token Not Found')) {
          console.log('Refresh token expired or invalid, clearing session');
          this.currentUser = null;
          // Clear any stored auth state
          await this.clearStoredSession();
          return null;
        }
        
        console.error('Session error:', error);
        this.currentUser = null;
        return null;
      }

      if (!session?.user) {
        console.log('No session user found');
        this.currentUser = null;
        return null;
      }
      
      console.log('Session found for user:', session.user.email);

      // Get worker profile
      
      console.log('🔍 Querying workers by membership_id:', session.user.id);
      
      // Get worker profile using admin functions
      const { getWorkerByUserId, getWorkerByEmail } = await import('./supabaseAdmin');
      
      let { data: worker, error: workerError } = await getWorkerByUserId(session.user.id);

      if (workerError) {
        console.log('Worker lookup by membership_id failed:', workerError.message);
      }

      // If not found by membership_id, try by email (fallback for older records)
      if (workerError || !worker) {
        console.log('Worker not found by membership_id, trying by email');
        const { data: emailWorker, error: emailWorkerError } = await getWorkerByEmail(session.user.email!);
          
        if (!emailWorkerError && emailWorker) {
          console.log('Worker found by email, updating membership_id');
          const { updateWorkerMembership } = await import('./supabaseAdmin');
          const { data: updatedWorker, error: updateError } = await updateWorkerMembership(emailWorker.id, session.user.id);
            
          if (updateError) {
            console.error('Failed to update worker membership_id:', updateError);
          }
            
          worker = updatedWorker || emailWorker;
          workerError = null;
        }
      }

      if (workerError || !worker) {
        console.error('Worker profile not found for user:', session.user.email);
        
        // Final attempt: comprehensive worker search
        try {
          const { data: emailWorkerResult, error: emailSearchError } = await getWorkerByEmail(session.user.email!);
          
          if (emailWorkerResult) {
            if (!emailWorkerResult.membership_id || emailWorkerResult.membership_id !== session.user.id) {
              const { updateWorkerMembership } = await import('./supabaseAdmin');
              const { data: updatedWorker, error: updateError } = await updateWorkerMembership(emailWorkerResult.id, session.user.id);
              
              if (!updateError && updatedWorker) {
                worker = updatedWorker;
                workerError = null;
              } else {
                worker = emailWorkerResult;
                workerError = null;
              }
            } else {
              worker = emailWorkerResult;
              workerError = null;
            }
          }
          
        } catch (searchError) {
          console.error('Worker search failed:', searchError);
        }
        
        // If no worker found, redirect to repair page
        if (workerError || !worker) {
          if (typeof window !== 'undefined') {
            window.location.href = '/repair';
          }
          this.currentUser = null;
          return null;
        }
      }

      // Fetch tenant information
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', worker.tenant_id)
        .single();

      if (tenantError) {
        console.error('Failed to fetch tenant:', tenantError);
      }

      const authUser: AuthUser = {
        id: session.user.id,
        email: worker.email,
        nombre: worker.full_name,
        tenantId: worker.tenant_id,
        rol: this.mapAreaModuleToRole(worker.area_module),
        activo: worker.status === 'active',
        tenant: tenant || null,
        worker: worker,
      };

      this.currentUser = authUser;
      return authUser;

    } catch (error: any) {
      console.error('Session check error:', error);
      
      // Handle refresh token errors specifically
      if (error.message?.includes('refresh_token_not_found') || 
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('Refresh Token Not Found')) {
        console.log('Clearing invalid session due to refresh token error');
        await this.clearStoredSession();
      }
      
      this.currentUser = null;
      return null;
    } finally {
      this.isCheckingSession = false;
    }
  }

  // Utility function to handle authentication errors gracefully
  handleAuthError(error: any): { shouldRetry: boolean; shouldLogout: boolean } {
    const errorMessage = error?.message || '';
    
    // Check for refresh token related errors
    if (errorMessage.includes('refresh_token_not_found') || 
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('JWT expired') ||
        errorMessage.includes('session_not_found')) {
      return { shouldRetry: false, shouldLogout: true };
    }
    
    // Network or temporary errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('fetch')) {
      return { shouldRetry: true, shouldLogout: false };
    }
    
    // Unknown errors - don't logout but don't retry either
    return { shouldRetry: false, shouldLogout: false };
  }

  // Enhanced method to safely get current session with retry logic
  async getSafeSession(retryCount: number = 0): Promise<{ user: AuthUser | null; error: string | null }> {
    // If we're already checking the session, return current user
    if (this.isCheckingSession && retryCount === 0) {
      return { user: this.currentUser, error: null };
    }
    
    try {
      const user = await this.checkSession();
      return { user, error: null };
    } catch (error: any) {
      const { shouldRetry, shouldLogout } = this.handleAuthError(error);
      
      if (shouldLogout) {
        await this.clearStoredSession();
        return { user: null, error: 'Session expired. Please login again.' };
      }
      
      if (shouldRetry && retryCount < 2) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.getSafeSession(retryCount + 1);
      }
      
      return { user: null, error: error.message || 'Authentication error occurred' };
    }
  }

  private async clearStoredSession(): Promise<void> {
    try {
      // Sign out to clear stored tokens
      await supabase.auth.signOut();
      this.currentUser = null;
    } catch (error) {
      console.error('Error clearing stored session:', error);
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return !!user && roles.includes(user.rol);
  }

  // Create tenant with first admin user
  async createTenantWithAdmin(data: {
    tenantName: string;
    slug: string;
    plan: string;
    primaryCrop: string;
    contactEmail: string;
    adminFullName: string;
    adminEmail: string;
    adminPassword: string;
    adminPhone: string;
    adminDocumentId: string;
  }): Promise<{ success: boolean; error: string | null; tenant?: Tenant }> {
    let createdUserId: string | null = null;
    let createdTenantId: string | null = null;

    try {
      // First check if user already exists
      const { data: existingWorker } = await supabase
        .from('workers')
        .select('email')
        .eq('email', data.adminEmail)
        .single();

      if (existingWorker) {
        return { success: false, error: "Ya existe un usuario registrado con este email" };
      }

      // Check if email already exists in auth (using admin client if available)
      if (supabaseAdmin) {
        try {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingAuthUser = authUsers.users.find(user => user.email === data.adminEmail);
          
          if (existingAuthUser) {
            return { success: false, error: "Este email ya está registrado en el sistema de autenticación. Use la opción de recuperar contraseña o contacte soporte." };
          }
        } catch (authCheckError) {
          console.warn('Could not check existing auth users:', authCheckError);
          // Continue anyway, the signUp will fail if user exists
        }
      }

      // Check if slug already exists
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('slug')
        .eq('slug', data.slug)
        .single();

      if (existingTenant) {
        return { success: false, error: "Ya existe una empresa con este identificador" };
      }

      // 1. Create the admin user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: data.adminPassword,
        options: {
          data: {
            full_name: data.adminFullName,
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, error: `Error de autenticación: ${authError.message}` };
      }

      if (!authData.user) {
        return { success: false, error: "No se pudo crear el usuario de autenticación" };
      }

      createdUserId = authData.user.id;

      // 2. Create the tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{
          name: data.tenantName,
          slug: data.slug,
          plan: data.plan,
          primary_crop: data.primaryCrop,
          contact_email: data.contactEmail,
          created_by: authData.user.id,
        }])
        .select()
        .single();

      if (tenantError) {
        console.error('Tenant error:', tenantError);
        throw new Error(`Error al crear la empresa: ${tenantError.message}`);
      }

      if (!tenant) {
        throw new Error("No se pudo crear la empresa");
      }

      createdTenantId = tenant.id;

      // 3. Create the worker profile
      const workerData = {
        tenant_id: tenant.id,
        full_name: data.adminFullName,
        document_id: data.adminDocumentId,
        email: data.adminEmail,
        phone: data.adminPhone || null, // Explicitly handle null for optional field
        area_module: 'administracion',
        membership_id: authData.user.id, // Link to auth user
        status: 'active',
      };

      console.log('Creating worker with data:', workerData);
      console.log('Tenant ID:', tenant.id);
      console.log('Auth User ID:', authData.user.id);

      const { error: workerError, data: workerResult } = await supabase
        .from('workers')
        .insert([workerData])
        .select(); // Add select to see what was created

      console.log('Worker insert result:', workerResult);

      if (workerError) {
        console.error('Worker error details:', {
          message: workerError.message,
          details: workerError.details,
          hint: workerError.hint,
          code: workerError.code
        });
        throw new Error(`Error al crear el perfil del administrador: ${workerError.message}`);
      }

      if (!workerResult || workerResult.length === 0) {
        throw new Error("No se pudo crear el perfil del administrador - no se devolvió ningún registro");
      }

      console.log('Worker created successfully:', workerResult[0]);

      // Verify that the worker can be found immediately with tenant relationship
      const { data: verifyWorker, error: verifyError } = await supabase
        .from('workers')
        .select('*')
        .eq('email', data.adminEmail)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .single();

      if (verifyError || !verifyWorker) {
        console.error('Worker verification failed:', verifyError);
        
        // Try one more time to get the worker with just basic fields
        const { data: basicWorker, error: basicError } = await supabase
          .from('workers')
          .select('*')
          .eq('email', data.adminEmail)
          .eq('tenant_id', tenant.id);
          
        console.log('Basic worker query result:', { basicWorker, basicError });
        
        if (!basicWorker || basicWorker.length === 0) {
          throw new Error("El perfil del administrador no fue creado correctamente. Contacta con soporte técnico.");
        } else {
          console.log('Worker found in basic query, continuing...');
        }
      } else {
        console.log('Worker verification successful:', verifyWorker);
      }

      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, error: null, tenant };

    } catch (error: any) {
      console.error('Transaction error:', error);
      
      // Cleanup in reverse order with proper admin client
      try {
        console.log('Starting cleanup process...');
        
        // 1. Delete worker if it was created
        if (createdTenantId) {
          console.log('Cleaning up worker...');
          const { error: workerCleanupError } = await supabase
            .from('workers')
            .delete()
            .eq('tenant_id', createdTenantId);
          
          if (workerCleanupError) {
            console.error('Worker cleanup error:', workerCleanupError);
          } else {
            console.log('Worker cleaned up successfully');
          }
        }

        // 2. Delete tenant if it was created
        if (createdTenantId) {
          console.log('Cleaning up tenant...');
          const { error: tenantCleanupError } = await supabase
            .from('tenants')
            .delete()
            .eq('id', createdTenantId);
          
          if (tenantCleanupError) {
            console.error('Tenant cleanup error:', tenantCleanupError);
          } else {
            console.log('Tenant cleaned up successfully');
          }
        }

        // 3. Delete auth user if it was created
        if (createdUserId) {
          console.log('Cleaning up auth user...');
          
          // Try with admin client first
          if (supabaseAdmin) {
            const { error: authCleanupError } = await supabaseAdmin.auth.admin.deleteUser(createdUserId);
            
            if (authCleanupError) {
              console.error('Auth cleanup error (admin):', authCleanupError);
              
              // If admin fails, try with regular client (user might not be confirmed)
              try {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                  email: data.adminEmail,
                  password: data.adminPassword,
                });
                
                if (!signInError) {
                  const { error: deleteError } = await supabase.auth.admin.deleteUser(createdUserId);
                  if (deleteError) {
                    console.error('Auth cleanup error (regular):', deleteError);
                  } else {
                    console.log('Auth user cleaned up successfully');
                  }
                }
              } catch (altCleanupError) {
                console.error('Alternative auth cleanup failed:', altCleanupError);
              }
            } else {
              console.log('Auth user cleaned up successfully');
            }
          } else {
            console.warn('No admin client available for auth cleanup');
          }
        }
        
        console.log('Cleanup process completed');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
        // Don't fail the main error, just log cleanup issues
      }

      return { 
        success: false, 
        error: error.message || "Error inesperado durante la creación de la cuenta" 
      };
    }
  }

  // Password reset
  async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || "Error inesperado" };
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || "Error inesperado" };
    }
  }

  // Add worker to existing tenant
  async addWorkerToTenant(data: {
    tenantId: string;
    fullName: string;
    documentId: string;
    email: string;
    password: string;
    phone: string;
    areaModule: string;
    membershipId: string;
  }): Promise<{ success: boolean; error: string | null }> {
    let createdUserId: string | null = null;

    try {
      // Check if email already exists
      const { data: existingWorker } = await supabase
        .from('workers')
        .select('email')
        .eq('email', data.email)
        .single();

      if (existingWorker) {
        return { success: false, error: "Ya existe un trabajador registrado con este email" };
      }

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          }
        }
      });

      if (authError) {
        return { success: false, error: `Error de autenticación: ${authError.message}` };
      }

      if (!authData.user) {
        return { success: false, error: "No se pudo crear el usuario de autenticación" };
      }

      createdUserId = authData.user.id;

      // 2. Create worker profile
      const { error: workerError } = await supabase
        .from('workers')
        .insert([{
          tenant_id: data.tenantId,
          full_name: data.fullName,
          document_id: data.documentId,
          email: data.email,
          phone: data.phone,
          area_module: data.areaModule,
          membership_id: authData.user.id, // Link to auth user
          status: 'active',
        }]);

      if (workerError) {
        throw new Error(`Error al crear el perfil del trabajador: ${workerError.message}`);
      }

      return { success: true, error: null };

    } catch (error: any) {
      console.error('Add worker error:', error);
      
      // Cleanup auth user if worker creation failed
      if (createdUserId && supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }

      return { 
        success: false, 
        error: error.message || "Error inesperado al crear el trabajador" 
      };
    }
  }

  // Utility function to check if user exists
  async checkUserExists(email: string): Promise<{ exists: boolean; inAuth: boolean; inWorkers: boolean }> {
    try {
      // Check in workers table
      const { data: worker } = await supabase
        .from('workers')
        .select('email')
        .eq('email', email)
        .single();

      // For auth check, we'd need admin privileges, so we'll just assume
      // if worker exists, auth user probably exists too
      return {
        exists: !!worker,
        inAuth: !!worker, // We assume this since we can't check without admin
        inWorkers: !!worker
      };
    } catch (error) {
      return {
        exists: false,
        inAuth: false,
        inWorkers: false
      };
    }
  }

  // Utility function to manually cleanup orphaned auth users (admin only)
  async cleanupOrphanedUser(email: string): Promise<{ success: boolean; error: string | null }> {
    if (!supabaseAdmin) {
      return { success: false, error: "No hay permisos de administrador para esta operación" };
    }

    try {
      // Find and delete user from auth
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        return { success: false, error: "Error al buscar usuarios" };
      }

      const userToDelete = users.users.find(u => u.email === email);
      
      if (userToDelete) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
        
        if (deleteError) {
          return { success: false, error: "Error al eliminar usuario" };
        }
        
        return { success: true, error: null };
      }

      return { success: false, error: "Usuario no encontrado" };
    } catch (error: any) {
      return { success: false, error: error.message || "Error inesperado" };
    }
  }

  // Utility function to clear corrupted session
  async clearCorruptedSession(): Promise<void> {
    try {
      console.log('Clearing corrupted session...')
      
      // Sign out from Supabase (this will clear the corrupted tokens)
      await supabase.auth.signOut();
      
      // Clear current user cache
      this.currentUser = null;
      
      console.log('Corrupted session cleared successfully')
    } catch (error) {
      console.error('Error clearing corrupted session:', error)
      // Even if signOut fails, clear the local state
      this.currentUser = null;
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();

// For backward compatibility, export as default auth service
export const authService = new SupabaseAuthService();