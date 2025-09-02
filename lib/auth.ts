import { usuarios, tenants, type Tenant } from "./mocks"

export interface AuthUser {
  id: string
  email: string
  nombre: string
  tenantId: string
  rol: "Admin" | "Campo" | "Empaque" | "Finanzas"
  tenant: Tenant
}

class AuthService {
  private currentUser: AuthUser | null = null

  async login(email: string, password: string): Promise<AuthUser> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const usuario = usuarios.find((u) => u.email === email)
    if (!usuario) {
      throw new Error("Usuario no encontrado")
    }

    // In a real app, you'd verify the password hash
    // For demo purposes, any password works

    const tenant = tenants.find((t) => t.id === usuario.tenantId)
    if (!tenant) {
      throw new Error("Tenant no encontrado")
    }

    const authUser: AuthUser = {
      ...usuario,
      tenant,
    }

    this.currentUser = authUser

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_user", JSON.stringify(authUser))
    }

    return authUser
  }

  async logout(): Promise<void> {
    this.currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user")
    }
  }

  getCurrentUser(): AuthUser | null {
    if (this.currentUser) {
      return this.currentUser
    }

    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored)
          return this.currentUser
        } catch {
          localStorage.removeItem("auth_user")
        }
      }
    }

    return null
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser()
    return user ? roles.includes(user.rol) : false
  }
}

export const authService = new AuthService()
