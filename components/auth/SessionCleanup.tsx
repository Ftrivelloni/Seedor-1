"use client"
import { useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function SessionCleanup() {
  useEffect(() => {
    const cleanupCorruptedSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('SessionCleanup: Session error detected:', error.message)
          
          if (error.message.includes('refresh_token_not_found') || 
              error.message.includes('Invalid Refresh Token')) {
            console.warn('SessionCleanup: Clearing corrupted session...')
            
            await supabase.auth.signOut()
            
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
            
            window.location.reload()
          }
        }
      } catch (error: any) {
        console.error('SessionCleanup: Error during cleanup:', error)
        
        if (error.message && (
            error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token'))) {
          console.log('SessionCleanup: Force clearing all auth data due to error')
          
          try {
            await supabase.auth.signOut()
          } catch (signOutError) {
          }
          
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
            
            window.location.reload()
          }
        }
      }
    }

    cleanupCorruptedSession()
  }, [])

  return null 
}