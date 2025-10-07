"use client"
import { usePathname } from 'next/navigation'
import { UserProvider } from './UserContext'
import { ReactNode } from 'react'

// Rutas públicas donde no necesitamos cargar el contexto del usuario
const publicRoutes = ['/', '/register-tenant', '/login', '/forgot-password', '/reset-password', '/contactenos']

export function ConditionalUserProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  
  // Verificamos si estamos en una ruta pública
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // Si estamos en una ruta pública, no cargamos el contexto del usuario
  if (isPublicRoute) {
    return <>{children}</>
  }
  
  // Si estamos en una ruta protegida, cargamos el contexto del usuario
  return <UserProvider>{children}</UserProvider>
}