/**
 * Configuración centralizada de rutas de la aplicación
 * Usando Next.js 13+ App Router
 */

export const ROUTES = {
  // Páginas públicas
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register-tenant',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Autenticación y setup
  ACCEPT_INVITATION: '/accept-invitacion',
  ADMIN_SETUP: '/admin-setup',
  USER_SETUP: '/user-setup',
  SET_PASSWORD: '/auth/set-password',
  
  // Páginas principales
  DASHBOARD: '/home',
  AJUSTES: '/ajustes',
  
  // Módulos específicos
  CAMPO: '/campo',
  CREAR_CAMPO: '/crear-campo',
  EMPAQUE: '/empaque',
  INVENTARIO: '/inventario',
  FINANZAS: '/finanzas',
  TRABAJADORES: '/trabajadores',
  USUARIOS: '/usuarios',
  CONTACTOS: '/contactos',
  CONTACTO: '/contacto',
  CONTACTENOS: '/contactenos',
  
  // Empaque sub-rutas
  EMPAQUE_INGRESO: '/empaque/ingreso-fruta',
  EMPAQUE_EGRESO: '/empaque/egreso-fruta',
  EMPAQUE_PREPROCESO: '/empaque/preproceso',
  EMPAQUE_PALLETS: '/empaque/pallets',
  EMPAQUE_DESPACHO: '/empaque/despacho',
  
  // Utilidades
  CLEANUP: '/cleanup',
  FUNCIONALIDADES: '/funcionalidades'
} as const

/**
 * Rutas que requieren autenticación
 */
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.AJUSTES,
  ROUTES.CAMPO,
  ROUTES.CREAR_CAMPO,
  ROUTES.EMPAQUE,
  ROUTES.INVENTARIO,
  ROUTES.FINANZAS,
  ROUTES.TRABAJADORES,
  ROUTES.USUARIOS,
  ROUTES.CONTACTOS,
  ROUTES.EMPAQUE_INGRESO,
  ROUTES.EMPAQUE_EGRESO,
  ROUTES.EMPAQUE_PREPROCESO,
  ROUTES.EMPAQUE_PALLETS,
  ROUTES.EMPAQUE_DESPACHO
]

/**
 * Rutas que requieren roles específicos
 */
export const ROLE_RESTRICTED_ROUTES = {
  ADMIN: [
    ROUTES.USUARIOS,
    ROUTES.AJUSTES
  ],
  EMPAQUE: [
    ROUTES.EMPAQUE,
    ROUTES.EMPAQUE_INGRESO,
    ROUTES.EMPAQUE_EGRESO,
    ROUTES.EMPAQUE_PREPROCESO,
    ROUTES.EMPAQUE_PALLETS,
    ROUTES.EMPAQUE_DESPACHO
  ],
  CAMPO: [
    ROUTES.CAMPO,
    ROUTES.CREAR_CAMPO
  ]
}

/**
 * Rutas públicas (no requieren autenticación)
 */
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.ACCEPT_INVITATION,
  ROUTES.ADMIN_SETUP,
  ROUTES.USER_SETUP,
  ROUTES.SET_PASSWORD,
  ROUTES.CONTACTENOS,
  ROUTES.FUNCIONALIDADES
]

/**
 * Función helper para verificar si una ruta es pública
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Función helper para verificar si una ruta está protegida
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}