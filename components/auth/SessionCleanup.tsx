"use client"
import { useEffect } from 'react'
import { tokenStorage } from '../../lib/auth/api-client'
import { sessionManager } from '../../lib/auth/session-manager'

/**
 * Component that cleans up corrupted or invalid auth sessions on mount.
 * Now uses our API-based auth system instead of direct Supabase calls.
 */
export function SessionCleanup() {
  useEffect(() => {
    const cleanupCorruptedSession = () => {
      try {
        // Check if we have a token but it's invalid/expired
        const hasToken = tokenStorage.getAccessToken() !== null
        const isValid = tokenStorage.hasValidToken()

        if (hasToken && !isValid) {
          console.warn('SessionCleanup: Invalid or expired token detected, clearing...')

          // Clear our auth storage
          tokenStorage.clearTokens()
          sessionManager.clearCurrentTabSession()

          // Also clear any legacy Supabase storage keys
          if (typeof window !== 'undefined') {
            const keysToRemove: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && (
                key.startsWith('sb-') ||
                key.includes('supabase') ||
                key === 'seedor-auth'
              )) {
                keysToRemove.push(key)
              }
            }

            keysToRemove.forEach(key => {
              localStorage.removeItem(key)
            })

            const sessionKeysToRemove: string[] = []
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i)
              if (key && (
                key.startsWith('sb-') ||
                key.includes('supabase')
              )) {
                sessionKeysToRemove.push(key)
              }
            }

            sessionKeysToRemove.forEach(key => {
              sessionStorage.removeItem(key)
            })
          }

          console.log('SessionCleanup: Corrupted session cleaned successfully')
        }
      } catch (error) {
        console.error('SessionCleanup: Error during cleanup:', error)

        // Force clear on error
        try {
          tokenStorage.clearTokens()
          sessionManager.clearCurrentTabSession()
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    cleanupCorruptedSession()
  }, [])

  return null
}