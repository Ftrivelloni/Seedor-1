"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { authService } from "../lib/auth"

interface LoginFormProps {
  onLoginSuccess: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await authService.login(email, password)
      onLoginSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl flex justify-center">
        <Card className="w-full shadow-lg rounded-2xl border border-muted bg-white/90 px-16 py-12 flex flex-col justify-center" style={{ minWidth: 400, maxWidth: 600 }}>
          <CardHeader className="pb-6">
            <div className="mb-6 w-full flex justify-center">
              <img src="/seedor-logo.png" alt="Seedor" className="h-20 w-auto drop-shadow" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2 w-full text-center">Iniciar sesión</CardTitle>
            <CardDescription className="mb-2 w-full text-center">Ingresa a tu plataforma de gestión agropecuaria</CardDescription>
          </CardHeader>
          <CardContent className="w-full p-0">
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              <div className="space-y-4 w-full">
                <Label htmlFor="email" className="w-full">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="h-12 text-base px-4 w-full"
                />
              </div>
              <div className="space-y-4 w-full">
                <Label htmlFor="password" className="w-full">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 text-base px-4 w-full"
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md w-full">{error}</div>}
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
            <div className="mt-8 text-sm text-muted-foreground w-full">
              <p className="font-medium mb-2">Usuarios de prueba:</p>
              <div className="space-y-1 text-xs">
                <p>
                  <strong>Admin:</strong> admin@latoma.com
                </p>
                <p>
                  <strong>Campo:</strong> campo@latoma.com
                </p>
                <p>
                  <strong>Empaque:</strong> empaque@latoma.com
                </p>
                <p>
                  <strong>Finanzas:</strong> finanzas@latoma.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
