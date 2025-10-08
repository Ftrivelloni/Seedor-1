/**
 * Utilidad para obtener la URL base de la aplicación
 * Funciona tanto en desarrollo como en production
 */
export function getBaseUrl(): string {
  // En el servidor (SSR/API routes)
  if (typeof window === 'undefined') {
    // Vercel automáticamente proporciona esta variable
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    
    // Para otros providers de hosting
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL
    }
    
    // Fallback para desarrollo
    return 'http://localhost:3000'
  }

  // En el cliente (browser)
  if (process.env.NODE_ENV === 'production') {
    // En production, usar el origen actual de la ventana
    return window.location.origin
  }

  // En desarrollo, usar la variable de entorno o localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Construye una URL completa con la ruta especificada
 */
export function buildUrl(path: string): string {
  const baseUrl = getBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}