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

export function EmpaqueAuthProvider({ children, initialUser = null }: { children: React.ReactNode, initialUser?: any | null }) {
  const [empaqueUser, setEmpaqueUser] = useState<any | null>(() => {
    if (initialUser) {
      return initialUser;
    }
    
    if (typeof window !== 'undefined' && window.empaqueLayoutUser) {
      return window.empaqueLayoutUser;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (empaqueUser) {
        window.empaqueLayoutUser = empaqueUser;
      } else {
        window.empaqueLayoutUser = undefined;
      }
    }
  }, [empaqueUser]);
  
  useEffect(() => {
    return () => {
    };
  }, []);

  const contextValue = { empaqueUser, setEmpaqueUser };
  
  return (
    <EmpaqueAuthContext.Provider value={contextValue}>
      {children}
    </EmpaqueAuthContext.Provider>
  );
}

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