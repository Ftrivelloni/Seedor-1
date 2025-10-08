/**
 * Script de verificación para las URLs de invitación
 * Ejecuta este script para verificar que las URLs se generan correctamente
 */

import { buildUrl } from './lib/utils/url'

console.log('🔍 Verificando configuración de URLs...\n')

console.log('Variables de entorno:')
console.log('- NODE_ENV:', process.env.NODE_ENV)
console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
console.log('- VERCEL_URL:', process.env.VERCEL_URL)

console.log('\n📝 URLs generadas:')
console.log('- URL base:', buildUrl(''))
console.log('- Admin setup:', buildUrl('/admin-setup?token=test-token'))
console.log('- User setup:', buildUrl('/user-setup?token=test-token'))
console.log('- Accept invitation:', buildUrl('/accept-invitacion?token=test-token'))

console.log('\n✅ Verificación completada')

// Función para testing
export function verifyUrls() {
  const baseUrl = buildUrl('')
  
  if (baseUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ ADVERTENCIA: URLs de production usando localhost!')
    return false
  }
  
  if (baseUrl.includes('seedor-1.vercel.app') || baseUrl.includes('localhost')) {
    console.log('✅ URLs configuradas correctamente')
    return true
  }
  
  console.error('❌ ERROR: URLs mal configuradas')
  return false
}