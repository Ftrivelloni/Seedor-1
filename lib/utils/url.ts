/**
 * Utilidad para obtener la URL base de la aplicación
 * Detecta automáticamente entre desarrollo y producción
 */
export function getBaseUrl(): string {
  // Verificar si estamos en desarrollo
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.NODE_ENV !== 'production'

  // En el servidor (SSR/API routes)
  if (typeof window === 'undefined') {
    // En desarrollo, usar localhost
    if (isDevelopment) {
      return 'http://localhost:3000'
    }
    
    // En producción - Vercel automáticamente proporciona esta variable
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    
    // Variable de entorno personalizada
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL
    }
    
    // Fallback
    return 'http://localhost:3000'
  }

  // En el cliente (browser)
  if (isDevelopment) {
    // En desarrollo, verificar si estamos realmente en localhost
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000'
    }
  }
  
  // En producción o si no es localhost, usar el origen actual
  return window.location.origin
}

/**
 * Construye una URL completa con la ruta especificada
 */
export function buildUrl(path: string): string {
  const baseUrl = getBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Configuración de URLs por ambiente
 */
export const URL_CONFIG = {
  development: {
    base: 'http://localhost:3000',
    adminSetup: 'http://localhost:3000/admin-setup',
    userSetup: 'http://localhost:3000/user-setup',
    acceptInvitation: 'http://localhost:3000/accept-invitacion',
    setPassword: 'http://localhost:3000/auth/set-password',
    resetPassword: 'http://localhost:3000/reset-password'
  },
  production: {
    base: 'https://seedor-1.vercel.app',
    adminSetup: 'https://seedor-1.vercel.app/admin-setup',
    userSetup: 'https://seedor-1.vercel.app/user-setup', 
    acceptInvitation: 'https://seedor-1.vercel.app/accept-invitacion',
    setPassword: 'https://seedor-1.vercel.app/auth/set-password',
    resetPassword: 'https://seedor-1.vercel.app/reset-password'
  }
}

/**
 * Obtiene las URLs según el entorno actual
 */
export function getEnvironmentUrls() {
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.NODE_ENV !== 'production'
  
  return isDevelopment ? URL_CONFIG.development : URL_CONFIG.production
}

/**
 * Construye URL de invitación específica según el tipo y entorno
 */
export function buildInvitationUrl(type: 'admin' | 'user', token: string): string {
  const urls = getEnvironmentUrls()
  const baseUrl = type === 'admin' ? urls.adminSetup : urls.userSetup
  return `${baseUrl}?token=${token}`
}