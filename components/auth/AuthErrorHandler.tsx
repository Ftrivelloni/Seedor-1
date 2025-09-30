"use client"
import { useEffect } from 'react'
import { authService } from '../../lib/supabaseAuth'

export function AuthErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Global error handler for uncaught authentication errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message
      
      if (error && typeof error === 'string' && (
          error.includes('refresh_token_not_found') ||
          error.includes('Invalid Refresh Token') ||
          error.includes('AuthApiError'))) {
        console.log('Global auth error detected, clearing session:', error)
        
        // Clear the corrupted session
        authService.clearCorruptedSession().then(() => {
          // Optionally redirect to login or show a toast
          console.log('Session cleared due to authentication error')
          
          // Force reload to clear any cached state
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }).catch((clearError: any) => {
          console.error('Error clearing session:', clearError)
          // Force reload anyway
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        })
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      
      if (error && (
          (error.message && (
            error.message.includes('refresh_token_not_found') ||
            error.message.includes('Invalid Refresh Token') ||
            error.message.includes('AuthApiError')
          )) ||
          (typeof error === 'string' && (
            error.includes('refresh_token_not_found') ||
            error.includes('Invalid Refresh Token') ||
            error.includes('AuthApiError')
          )))) {
        console.log('Global unhandled auth promise rejection, clearing session:', error)
        
        // Prevent the error from being logged to console
        event.preventDefault()
        
        // Clear the corrupted session
        authService.clearCorruptedSession().then(() => {
          console.log('Session cleared due to unhandled authentication error')
          
          // Force reload to clear any cached state
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }).catch((clearError: any) => {
          console.error('Error clearing session:', clearError)
          // Force reload anyway
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        })
      }
    }

    // Add global error listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <>{children}</>
}