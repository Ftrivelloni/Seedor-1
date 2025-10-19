"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useUser, useUserActions } from './auth/UserContext'
import { tenantApi } from '../lib/api'
import { getSessionManager } from '../lib/sessionManager'

export default function TenantSelector() {
  const { user } = useUser()
  const { setUser, setSelectedTenant } = useUserActions()
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const sessionManager = typeof window !== 'undefined' ? getSessionManager() : null
  const [selected, setSelected] = useState<string | null>(() => {
    if (typeof window === 'undefined' || !sessionManager) return null
    try {
      const s = sessionManager.peekCurrentUser()
      return (s && (s as any).tenantId) || null
    } catch (e) {
      return null
    }
  })

  // Track last user id we loaded tenants for so we don't repeatedly refetch
  const lastLoadedUserId = useRef<string | null>(null)
  const isPersistingRef = useRef(false)

  useEffect(() => {
    if (!user) return

    // If we've already loaded for this user and have tenants, skip.
    if (lastLoadedUserId.current === user.id && tenants.length > 0) return
    lastLoadedUserId.current = user.id

    const load = async () => {
      // prevent concurrent loads
      if (loading) return
      setLoading(true)
      try {
        console.debug('[TenantSelector] loading tenants for user', user?.id)
        const list = await tenantApi.getUserTenants(user.id)
        console.debug('[TenantSelector] tenants result:', list)
        setTenants(list || [])

        // Do not auto-select tenant for the user. Only use existing session selection
        // if present and valid. Otherwise leave null so UI prompts user to choose.
        if (!selected) {
          try {
            const peek = sessionManager?.peekCurrentUser()
            if (peek && peek.tenantId && list.some((t: any) => t.id === peek.tenantId)) {
              setSelected(peek.tenantId)
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (err: any) {
        const message = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
        console.error('[TenantSelector] Error loading tenants:', message)

        // Fallback: if API fails, use the user's current tenant from session if available
        if (user?.tenant) {
          setTenants([user.tenant])
          if (!selected) {
            const fallbackId = user.tenant.id || user.tenantId
            if (fallbackId) {
              setSelected(fallbackId)
              try { localStorage.setItem('seedor.selectedTenant', fallbackId) } catch {}
            }
          }
        } else {
          setTenants([])
        }
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    // Sync selected id into user context when changed. Only proceed if a selection
    // exists and we have a user. Persist selection in SessionManager so it is
    // accessible across tabs for the duration of the session.
    if (!selected || !user) return
    const tenantObj = tenants.find(t => t.id === selected) || user.tenant || null
    if (!tenantObj) {
      console.debug('[TenantSelector] selected tenant not found in fetched list and no user.tenant fallback')
      return
    }

    const membership = user.memberships?.find((m: any) => m.tenant_id === selected) || null
    const desiredRole = membership?.role_code || user.rol

    // Avoid re-entrancy: if session already reflects this selection/role, do nothing
    try {
      const current = sessionManager?.peekCurrentUser()
      if (current && current.tenantId === selected && (current.rol === desiredRole || !desiredRole)) {
        // Ensure local user state mirrors persisted session but avoid setting if identical
        if (user.tenantId !== selected || user.rol !== desiredRole) {
          setUser?.({ ...user, tenant: tenantObj, tenantId: (tenantObj as any).id, rol: desiredRole })
        }
        return
      }
    } catch (e) {
      // ignore peek errors
    }

    if (isPersistingRef.current) return
    isPersistingRef.current = true

    const newUser = {
      ...user,
      tenant: tenantObj,
      tenantId: (tenantObj as any).id,
      rol: desiredRole
    }

    console.debug('[TenantSelector] persisting selection via setSelectedTenant', newUser.tenant?.id, 'role:', newUser.rol)
    try {
      if (setSelectedTenant) {
        setSelectedTenant(tenantObj, newUser.rol)
      } else {
        sessionManager?.setCurrentUser(newUser)
        setUser?.(newUser)
      }
    } catch (e) {
      console.warn('[TenantSelector] could not persist selection to sessionManager', e)
      setUser?.(newUser)
    } finally {
      isPersistingRef.current = false
    }
  }, [selected, tenants, user])

  if (!user) return null

  // If still loading and have no tenants to show, show a disabled Loading option
  if (loading && tenants.length === 0) {
    return (
      <div className="inline-block">
        <select className="bg-transparent text-sidebar-foreground text-sm font-semibold" disabled>
          <option>Loading...</option>
        </select>
      </div>
    )
  }

  // Build options - prefer tenants array but include user's tenant as fallback
  const options = (tenants && tenants.length > 0) ? tenants : (user.tenant ? [user.tenant] : [])

  return (
    <div className="inline-block">
      <select
        value={selected || ''}
        onChange={(e) => setSelected(e.target.value)}
        className="bg-transparent text-sidebar-foreground text-sm font-semibold"
      >
        {options.map((t: any) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  )
}
