"use client"
import { useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function SessionCleanup() {
  useEffect(() => {
    const cleanupCorruptedSession = async () => {
      try {
        // Try to get the current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('SessionCleanup: Session error detected:', error.message)
          
          // If it's a refresh token error, clear everything
          if (error.message.includes('refresh_token_not_found') || 
              error.message.includes('Invalid Refresh Token')) {
            console.warn('SessionCleanup: Clearing corrupted session...')
            
            // Sign out (this will clear the tokens)
            await supabase.auth.signOut()
            
            // Clear any localStorage items that might contain auth data
            if (typeof window !== 'undefined') {
              const keysToRemove = []
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && (
                  key.includes('supabase') || 
                  key.includes('auth') ||
                  key.includes('session') ||
                  key.includes('token')
                )) {
                  keysToRemove.push(key)
                }
              }
              
              keysToRemove.forEach(key => {
                localStorage.removeItem(key)
              })
              
              // Also clear sessionStorage
              const sessionKeysToRemove = []
              for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i)
                if (key && (
                  key.includes('supabase') || 
                  key.includes('auth') ||
                  key.includes('session') ||
                  key.includes('token')
                )) {
                  sessionKeysToRemove.push(key)
                }
              }
              
              sessionKeysToRemove.forEach(key => {
                sessionStorage.removeItem(key)
              })
            }
            
            console.log('SessionCleanup: Corrupted session cleaned successfully')
            
            // Force a page reload to ensure clean state
            window.location.reload()
          }
        }
        // Silently pass if session is valid
      } catch (error: any) {
        console.error('SessionCleanup: Error during cleanup:', error)
        
        // If we get here, there's definitely a corrupted session
        if (error.message && (
            error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token'))) {
          console.log('SessionCleanup: Force clearing all auth data due to error')
          
          try {
            await supabase.auth.signOut()
          } catch (signOutError) {
            // Silent fallback
          }
          
          // Clear all possible auth-related storage
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
            
            // Force reload
            window.location.reload()
          }
        }
      }
    }

    // Run cleanup immediately
    cleanupCorruptedSession()
  }, [])

  return null // This component doesn't render anything
}