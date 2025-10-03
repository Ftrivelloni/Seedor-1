"use client"

import React, { createContext, useContext, useState, useEffect } from "react";

// Define the context
interface EmpaqueAuthContextType {
  empaqueUser: any | null;
  setEmpaqueUser: (user: any | null) => void;
}

const EmpaqueAuthContext = createContext<EmpaqueAuthContextType>({
  empaqueUser: null,
  setEmpaqueUser: () => {}
});

// Provider component
export function EmpaqueAuthProvider({ children, initialUser = null }: { children: React.ReactNode, initialUser?: any | null }) {
  const [empaqueUser, setEmpaqueUser] = useState<any | null>(() => {
    // First try to use the initialUser prop if provided
    if (initialUser) {
      return initialUser;
    }
    
    // Then try to initialize from window if available (for SSR safety)
    if (typeof window !== 'undefined' && window.empaqueLayoutUser) {
      return window.empaqueLayoutUser;
    }
    return null;
  });

  // Also maintain the window variable for backward compatibility
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (empaqueUser) {
        window.empaqueLayoutUser = empaqueUser;
      } else {
        window.empaqueLayoutUser = undefined;
      }
    }
  }, [empaqueUser]);
  
  // Provider mount effect
  useEffect(() => {
    return () => {
      // Cleanup when unmounted
    };
  }, []);

  const contextValue = { empaqueUser, setEmpaqueUser };
  
  return (
    <EmpaqueAuthContext.Provider value={contextValue}>
      {children}
    </EmpaqueAuthContext.Provider>
  );
}

// Hook to use the context
export function useEmpaqueAuth() {
  const context = useContext(EmpaqueAuthContext);
  
  if (context === undefined) {
    return { 
      empaqueUser: typeof window !== 'undefined' ? window.empaqueLayoutUser || null : null, 
      setEmpaqueUser: () => {} 
    };
  }
  
  return context;
}