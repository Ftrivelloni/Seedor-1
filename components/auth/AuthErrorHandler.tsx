"use client"
import { useEffect } from 'react'
import { authService } from '../../lib/auth'

export function AuthErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const clearAndRedirect = async () => {
      try {
        await authService.logout()
      } catch {
        // Ignore logout errors
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

    const isAuthError = (error: unknown): boolean => {
      if (!error) return false

      const errorMessage = typeof error === 'string'
        ? error
        : (error as Error)?.message || ''

      return (
        errorMessage.includes('refresh_token_not_found') ||
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('AuthApiError') ||
        errorMessage.includes('401') ||
        errorMessage.includes('Unauthorized')
      )
    }

    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message

      if (isAuthError(error)) {
        console.log('Global auth error detected, clearing session:', error)
        clearAndRedirect()
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason

      if (isAuthError(error)) {
        console.log('Global unhandled auth promise rejection, clearing session:', error)
        event.preventDefault()
        clearAndRedirect()
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <>{children}</>
}
