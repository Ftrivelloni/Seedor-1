// Implementación front que usa mocks y persiste en localStorage
import * as data from "./mocks"

export type Tenant = data.Tenant
export interface AuthUser {
  id: string
  email: string
  nombre: string
  tenantId: string
  rol: "Admin" | "Campo" | "Empaque" | "Finanzas"
  tenant: Tenant
}

const LS_KEY = "seedor_user"

class AuthService {
  private currentUser: AuthUser | null = null

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(LS_KEY)
        if (raw) this.currentUser = JSON.parse(raw)
      } catch {}
    }
  }

  async login(email: string, password: string, _opts?: { remember?: boolean }): Promise<AuthUser | null> {
    // Simula latencia
    await new Promise((r) => setTimeout(r, 300))

    const usuarios: any[] = (data as any).usuarios || []
    const tenants: Tenant[] = (data as any).tenants || [
      { id: "t-la-toma", nombre: "La Toma", tipo: "citrus" },
      { id: "t-campo-norte", nombre: "Campo Norte", tipo: "cereales" },
    ]

    const user = usuarios.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) return null

    // Validación básica de pass: 4+ chars (o podés usar "demo123")
    if (!password || password.length < 4) return null

    const tenant = tenants.find((t) => t.id === user.tenantId) || { id: user.tenantId, nombre: "Mi campo", tipo: "general" }

    const authUser: AuthUser = { ...user, tenant }
    this.currentUser = authUser
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, JSON.stringify(authUser))
    }
    return authUser
  }

  logout() {
    this.currentUser = null
    if (typeof window !== "undefined") window.localStorage.removeItem(LS_KEY)
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser()
    return !!user && roles.includes(user.rol)
  }
}

export const authService = new AuthService()
