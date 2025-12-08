'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService, validators, tokenStorage } from '../../lib/auth'
import type { AuthUser } from '../../lib/auth/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function SetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [setting, setSetting] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 Checking session for set-password...')

        // First, check if we already have a valid token in our storage
        if (tokenStorage.hasValidToken()) {
          try {
            const user = await authService.getMe()
            setSessionUser(user)
            setLoading(false)
            return
          } catch {
            // Token invalid, continue to check other sources
          }
        }

        // Check if tokens are in URL hash (from Supabase magic link redirect)
        // Format: #access_token=...&refresh_token=...&type=magiclink
        if (typeof window !== 'undefined' && window.location.hash) {
          console.log('🔍 Found URL hash, extracting tokens...')
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          if (accessToken) {
            console.log('✅ Found access_token in URL hash')

            // Validate token through our API
            const result = await authService.validateTokenFromHash(accessToken, refreshToken || undefined)

            if (result.success) {
              console.log('✅ Token validated and stored')
              // Clear hash from URL for cleaner look
              window.history.replaceState(null, '', window.location.pathname + window.location.search)

              try {
                const user = await authService.getMe()
                setSessionUser(user)
                setLoading(false)
                return
              } catch {
                // Continue to error handling
              }
            }
          }
        }

        // Fallback: try to validate from localStorage (legacy Supabase storage)
        console.log('🔧 No token in hash, trying localStorage...')
        const result = await authService.validateAndTransferSupabaseToken()

        if (!result.success) {
          setError('No hay una sesión válida. Por favor, usa el link de invitación enviado a tu email.')
          setLoading(false)
          return
        }

        console.log('✅ Supabase session token validated and stored')

        // Now try to get user from API
        try {
          const user = await authService.getMe()
          setSessionUser(user)
          setLoading(false)
        } catch {
          setError('Error al verificar sesión. Por favor, usa el link de invitación nuevamente.')
          setLoading(false)
        }

      } catch {
        setError('Error inesperado al verificar sesión.')
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validators.password(password)) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSetting(true)

    try {
      // Actualizar contraseña usando el API
      await authService.setPassword(password)

      setSuccess(true)

      setTimeout(() => {
        const token = searchParams.get('token')
        if (token) {
          router.push(`/accept-invitacion?token=${token}&from=set-password`)
        } else {
          router.push('/login?message=password-set')
        }
      }, 2000)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setError(message)
    } finally {
      setSetting(false)
    }
  }

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="size-12 animate-spin text-[#81C101] mb-4" />
            <p className="text-sm text-muted-foreground">Verificando sesión...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="size-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              ¡Contraseña establecida!
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Tu contraseña ha sido configurada exitosamente. Redirigiendo...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
      <CardHeader className="space-y-1 pb-8 pt-10 text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Establecer Contraseña
        </CardTitle>
        <CardDescription className="text-gray-600">
          {sessionUser?.email && (
            <>Para <strong>{sessionUser.email}</strong><br /></>
          )}
          Establecé tu contraseña para completar el registro
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repetí la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#81C101] hover:bg-[#73B001] text-white"
            disabled={setting}
          >
            {setting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Estableciendo...
              </>
            ) : (
              'Establecer Contraseña'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}