"use client";

import { useCallback, useEffect } from 'react';

/**
 * Hook to handle Supabase session timeouts and maintain session token availability
 * @returns Functions to manage session tokens
 */
export function useSessionTimeout() {
  // Store access token in sessionStorage for fallback
  useEffect(() => {
    const storeCurrentToken = async () => {
      try {
        const { supabase } = await import('../lib/supabaseClient');
        const { data } = await supabase.auth.getSession();
        
        if (data?.session?.access_token) {
          sessionStorage.setItem('accessToken', data.session.access_token);
        }
      } catch (error) {
        console.error('Failed to store access token:', error);
      }
    };
    
    // Store token when component mounts
    storeCurrentToken();
  }, []);
  
  /**
   * Get a session token with timeout handling
   * @param timeoutMs - Timeout in milliseconds
   * @returns Session object with access_token or null
   */
  const getSessionWithTimeout = useCallback(async (timeoutMs = 8000) => {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      
      // Add timeout handling for getSession
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session request timeout')), timeoutMs);
      });
      
      const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
      return result.data.session;
    } catch (error) {
      console.error('Session timeout or error:', error);
      
      // Try fallback token
      const fallbackToken = sessionStorage.getItem('accessToken');
      if (fallbackToken) {
        console.log('Using fallback token');
        return { access_token: fallbackToken };
      }
      
      return null;
    }
  }, []);
  
  /**
   * Attempt to refresh the session token
   * @returns True if refresh was successful
   */
  const refreshSessionToken = useCallback(async () => {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }
      
      if (data.session?.access_token) {
        sessionStorage.setItem('accessToken', data.session.access_token);
        console.log('Session refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }, []);
  
  /**
   * Get a session token, trying to refresh if needed
   */
  const getSessionToken = useCallback(async () => {
    // First try to get a token with timeout
    const session = await getSessionWithTimeout();
    if (session?.access_token) {
      return session.access_token;
    }
    
    // If that fails, try to refresh
    const refreshed = await refreshSessionToken();
    if (refreshed) {
      return sessionStorage.getItem('accessToken');
    }
    
    // Fall back to stored token if any
    return sessionStorage.getItem('accessToken');
  }, [getSessionWithTimeout, refreshSessionToken]);
  
  /**
   * Execute an API call with automatic token handling
   * @param apiCall Function that takes a token and returns a Promise
   * @param maxRetries Maximum number of retries
   */
  const callApiWithSession = useCallback(async <T>(
    apiCall: (token: string) => Promise<T>, 
    maxRetries = 1
  ): Promise<T> => {
    let token = await getSessionToken();
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        if (!token) {
          throw new Error('No valid session token available');
        }
        
        return await apiCall(token);
      } catch (error) {
        console.error(`API call failed (attempt ${retries + 1}/${maxRetries + 1})`, error);
        
        if (retries < maxRetries) {
          // Try to refresh token and retry
          await refreshSessionToken();
          token = await getSessionToken();
          retries++;
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Maximum retries exceeded');
  }, [getSessionToken, refreshSessionToken]);

  return {
    getSessionWithTimeout,
    refreshSessionToken,
    getFallbackToken: () => sessionStorage.getItem('accessToken'),
    getSessionToken,
    callApiWithSession
  };
}