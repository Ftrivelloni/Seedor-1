"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"

export default function DebugPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // Capturar todos los parámetros de la URL
    const allParams: any = {}
    searchParams.forEach((value, key) => {
      allParams[key] = value
    })

    // Capturar información adicional
    const debugData = {
      urlParams: allParams,
      fullUrl: window.location.href,
      hash: window.location.hash,
      search: window.location.search,
      pathname: window.location.pathname,
      origin: window.location.origin,
      userAgent: navigator.userAgent
    }

    setDebugInfo(debugData)
    
    // Auto-redirigir si hay token válido después de 5 segundos
    if (allParams.token) {
      setTimeout(() => {
        router.push(`/admin-setup?token=${allParams.token}`)
      }, 5000)
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>🔍 Debug - URL Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">URL Completa:</h3>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                {debugInfo.fullUrl}
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold">Parámetros de URL:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded">
                {JSON.stringify(debugInfo.urlParams, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold">Información de Navegación:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded">
                {JSON.stringify({
                  pathname: debugInfo.pathname,
                  search: debugInfo.search,
                  hash: debugInfo.hash,
                  origin: debugInfo.origin
                }, null, 2)}
              </pre>
            </div>

            {debugInfo.urlParams?.token && (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">
                  ✅ Token encontrado: {debugInfo.urlParams.token.substring(0, 20)}...
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Redirigiendo a admin-setup en 5 segundos...
                </p>
              </div>
            )}

            {!debugInfo.urlParams?.token && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800">
                  ❌ No se encontró token en la URL
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}