"use client"

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { authService } from '../../../lib/supabaseAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card'
import { UserPlus, Shield } from 'lucide-react'

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
}

export default function ExistingLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const emailParam = params.get('email') || ''

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onConfirm = async () => {
    setError(null)
    setLoading(true)
    try {
      const { user, error: loginError } = await authService.login(emailParam, password)
      if (loginError || !user) {
        setError('Contraseña inválida')
        return
      }

      // Call server to create tenant and membership for this existing user
      const storedForm = localStorage.getItem('seedor.tenant.registration')
      if (!storedForm) {
        setError('No se encontró información del formulario. Volvé al formulario y reintentá.')
        return
      }

      const formData = JSON.parse(storedForm)

      // Map frontend saved keys to server expected payload
      const payload = {
        tenantName: formData.companyName,
        slug: formData.companyName ? generateSlug(formData.companyName) : formData.slug || '',
        plan: formData.selectedPlan || 'profesional',
        contactName: formData.contactName || '',
        contactEmail: formData.contactEmail || emailParam,
        ownerPhone: formData.ownerPhone || undefined,
        existingUserId: user.id
      }

      const res = await fetch('/api/tenant/create-for-existing-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Error creando empresa')
        return
      }

      // Try to refresh the client session/memberships so AdminSetupForm detects the new tenant membership.
      try {
        let refreshed = false
        for (let i = 0; i < 6; i++) {
          const sessionResult: any = await authService.getSafeSession()
          const refreshedUser = sessionResult?.user
          if (refreshedUser && refreshedUser.tenantId) {
            refreshed = true
            break
          }
          // wait 300ms and try again
          await new Promise((res) => setTimeout(res, 300))
        }
        if (!refreshed) {
          console.warn('Could not refresh session memberships after tenant creation; admin-setup may require token')
        }
      } catch (e) {
        console.warn('Error refreshing session after tenant create', e)
      }

      // Persist a short-lived sessionStorage flag so admin-setup can pick it up when token/session is missing
      try {
        sessionStorage.setItem('admin_after_create', JSON.stringify({ tenant: json.data.tenant, user: user }));
      } catch (e) {
        console.warn('Could not persist admin_after_create', e);
      }

      // Debug logging: show the response and stored flag
      console.log('✅ create-for-existing-user result json:', json);
      try {
        console.log('🔁 admin_after_create stored:', sessionStorage.getItem('admin_after_create'));
      } catch (e) {
        console.warn('Could not read admin_after_create after storing', e);
      }

      // Guarded redirect: ensure we have a tenant id to navigate to, otherwise surface an error and stay on the page
      const tenantId = json?.data?.tenant?.id;
      if (!tenantId) {
        console.error('❌ No tenant id returned from server create; staying on page and showing error', json);
        setError('No se pudo crear la empresa (falta tenant id). Volvé al formulario e intentá de nuevo.');
        return;
      }

      // small delay to ensure sessionStorage is flushed and any session refresh completes
      setTimeout(() => {
        try {
          // Use hard navigation to avoid client-side router interception
          window.location.href = `/admin-setup?tenantId=${encodeURIComponent(tenantId)}`;
        } catch (e) {
          // Fallback to router if window navigation fails
          router.push(`/admin-setup?tenantId=${encodeURIComponent(tenantId)}`);
        }
      }, 250);

    } catch (err: any) {
      setError(err?.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <Shield className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Esta cuenta ya existe</CardTitle>
          <CardDescription className="text-slate-600 mt-2">Ingresá tu contraseña para continuar. Email: <strong className="text-[#81C101]">{emailParam}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={emailParam} disabled className="mt-2 bg-slate-50 text-slate-600 cursor-not-allowed" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" />
            </div>

            {error && <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button onClick={onConfirm} disabled={loading} className="flex-1 h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">{loading ? 'Validando...' : 'Confirmar'}</Button>
          <Button variant="outline" onClick={() => router.back()} className="flex-1 h-12 border-2 border-slate-200 hover:border-slate-300">Volver</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
