import { authService as supabaseAuthService } from './supabaseAuth'

export type Tenant = {
  id: string
  nombre: string
  tipo: string
  plan?: string
}

export interface AuthUser {
  id: string
  email: string
  nombre: string
  tenantId: string
  rol: "Admin" | "Campo" | "Empaque" | "Finanzas"
  tenant: Tenant
  profile?: any
  memberships?: any[]
  worker?: any
}

const LS_KEY = "seedor_user"

class AuthService {
  private currentUser: AuthUser | null = null

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored)
        } catch (e) {
          console.warn("Error parsing stored user:", e)
        }
      }
    }
  }

  async login(email: string, password: string, _opts?: { remember?: boolean }): Promise<AuthUser | null> {
    try {
      console.log('🔄 AuthService: Attempting Supabase login...')
      
      const { user, error } = await supabaseAuthService.login(email, password)
      
      if (error || !user) {
        console.error('AuthService: Login failed:', error)
        return null
      }

      console.log('AuthService: Supabase login successful:', user.email)

      const authUser = this.convertSupabaseUserToAuthUser(user)
      
      this.currentUser = authUser
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_KEY, JSON.stringify(authUser))
      }
      
      return authUser
    } catch (error: any) {
      console.error('AuthService: Login error:', error)
      return null
    }
  }

  async checkSession(): Promise<AuthUser | null> {
    try {
      // Reducir logs excesivos
      const { user, error } = await supabaseAuthService.getSafeSession()
      
      if (error || !user) {
        // Log mínimo para depuración
        if (process.env.NODE_ENV === 'development' && typeof window !== "undefined") {
          // console.log('AuthService: No valid session')
        }
        this.currentUser = null
        if (typeof window !== "undefined") {
          localStorage.removeItem(LS_KEY)
        }
        return null
      }

      // Log condicional solo en desarrollo
      if (process.env.NODE_ENV === 'development' && typeof window !== "undefined") {
        // console.log('AuthService: Valid session found:', user.email)
      }
      
      const authUser = this.convertSupabaseUserToAuthUser(user)
      this.currentUser = authUser
      
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_KEY, JSON.stringify(authUser))
      }
      
      return authUser
    } catch (error: any) {
      console.error('AuthService: Session check error:', error)
      this.currentUser = null
      if (typeof window !== "undefined") {
        localStorage.removeItem(LS_KEY)
      }
      return null
    }
  }

  async logout() {
    console.log('AuthService: Iniciando cierre de sesión...')
    
    // Primero, limpiar datos locales para una experiencia más rápida
    this.currentUser = null
    
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_KEY)
      sessionStorage.clear() // Limpiar también sessionStorage por si acaso
    }
    
    // Luego, intentar cerrar sesión en Supabase
    try {
      const { error } = await supabaseAuthService.logout()
      
      if (error) {
        console.error('AuthService: Error al cerrar sesión:', error)
      } else {
        console.log('AuthService: Sesión cerrada correctamente')
      }
    } catch (err) {
      console.error('AuthService: Excepción al cerrar sesión:', err)
    }
    
    console.log('AuthService: Proceso de cierre de sesión completado')
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return !!this.currentUser
  }

  hasRole(roles: string[]): boolean {
    return !!this.currentUser && roles.includes(this.currentUser.rol)
  }

  private convertSupabaseUserToAuthUser(supabaseUser: any): AuthUser {
    const membership = supabaseUser.memberships?.[0]
    const tenant = membership?.tenants

    const roleMap: { [key: string]: string } = {
      'administracion': 'Admin',
      'administración': 'Admin', 
      'admin': 'Admin',
      'campo': 'Campo',
      'empaque': 'Empaque',
      'finanzas': 'Finanzas',
      'general': 'Admin'
    }

    // Buscar worker data si existe
    let workerData: any = null
    if (membership?.tenant_id) {
      // Aquí podrías hacer una query adicional para obtener worker data
      // Por ahora, usar datos del membership
    }

    const areaModule = membership?.role_code?.toLowerCase() || 'admin'
    const rol = roleMap[areaModule] || 'Admin'

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      nombre: supabaseUser.profile?.full_name || supabaseUser.user_metadata?.full_name || 'Usuario',
      tenantId: membership?.tenant_id || '',
      rol: rol as "Admin" | "Campo" | "Empaque" | "Finanzas",
      tenant: {
        id: tenant?.id || '',
        nombre: tenant?.name || 'Mi Empresa',
        tipo: 'general',
        plan: tenant?.plan || 'basic'
      },
      profile: supabaseUser.profile,
      memberships: supabaseUser.memberships,
      worker: workerData
    }
  }
}

export const authService = new AuthService()