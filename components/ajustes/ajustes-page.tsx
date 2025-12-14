"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { useAuth } from "../../hooks/use-auth"
import { useFeatures } from "../../lib/features-context"
import { toast } from "../../hooks/use-toast"
import { User, Building, Shield, Settings, Info, CheckCircle, XCircle, Crown, CreditCard, RefreshCcw, Ban } from "lucide-react"

const rolePermissions = {
  Admin: {
    description: "Acceso completo a todas las funcionalidades del sistema",
    permissions: [
      { module: "Dashboard", access: true, description: "Ver resumen general" },
      { module: "Campo", access: true, description: "Gestionar tareas de campo" },
      { module: "Empaque", access: true, description: "Registros de procesamiento" },
      { module: "Inventario", access: true, description: "Control de stock" },
      { module: "Finanzas", access: true, description: "Gestión de caja chica" },
      { module: "Trabajadores", access: true, description: "Gestión de trabajadores" },
      { module: "Contactos", access: true, description: "Gestión de contactos" },
      { module: "Usuarios", access: true, description: "Gestión de usuarios" },
      { module: "Ajustes", access: true, description: "Configuración del sistema" },
    ],
  },
  Campo: {
    description: "Acceso a gestión de campo, trabajadores e inventario",
    permissions: [
      { module: "Dashboard", access: true, description: "Ver resumen general" },
      { module: "Campo", access: true, description: "Gestionar tareas de campo" },
      { module: "Empaque", access: false, description: "Sin acceso a empaque" },
      { module: "Inventario", access: true, description: "Control de stock" },
      { module: "Finanzas", access: false, description: "Sin acceso a finanzas" },
      { module: "Trabajadores", access: true, description: "Gestión de trabajadores" },
      { module: "Contactos", access: true, description: "Gestión de contactos" },
      { module: "Usuarios", access: false, description: "Sin acceso a gestión de usuarios" },
      { module: "Ajustes", access: true, description: "Configuración personal" },
    ],
  },
  Empaque: {
    description: "Acceso a empaque e inventario",
    permissions: [
      { module: "Dashboard", access: true, description: "Ver resumen general" },
      { module: "Campo", access: false, description: "Sin acceso a campo" },
      { module: "Empaque", access: true, description: "Registros de procesamiento" },
      { module: "Inventario", access: true, description: "Control de stock" },
      { module: "Finanzas", access: false, description: "Sin acceso a finanzas" },
      { module: "Trabajadores", access: false, description: "Sin acceso a trabajadores" },
      { module: "Contactos", access: true, description: "Gestión de contactos" },
      { module: "Usuarios", access: false, description: "Sin acceso a gestión de usuarios" },
      { module: "Ajustes", access: true, description: "Configuración personal" },
    ],
  },
  Finanzas: {
    description: "Acceso a gestión financiera e inventario",
    permissions: [
      { module: "Dashboard", access: true, description: "Ver resumen general" },
      { module: "Campo", access: false, description: "Sin acceso a campo" },
      { module: "Empaque", access: false, description: "Sin acceso a empaque" },
      { module: "Inventario", access: true, description: "Control de stock" },
      { module: "Finanzas", access: true, description: "Gestión de caja chica" },
      { module: "Trabajadores", access: false, description: "Sin acceso a trabajadores" },
      { module: "Contactos", access: true, description: "Gestión de contactos" },
      { module: "Usuarios", access: false, description: "Sin acceso a gestión de usuarios" },
      { module: "Ajustes", access: true, description: "Configuración personal" },
    ],
  },
}

export function AjustesPage() {
  const { user, loading: authLoading } = useAuth()
  const { planInfo, refreshFeatures } = useFeatures()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [portalLoading, setPortalLoading] = useState(false)
  const [planLoading, setPlanLoading] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Error al cargar información del usuario</p>
      </div>
    )
  }

  const userPermissions = rolePermissions[(user.rol || 'campo') as keyof typeof rolePermissions]
  const isAdmin = user.rol?.toLowerCase() === 'admin'
  const currentPlanKey = (planInfo?.plan_name || '').toLowerCase()

  const handleEditName = () => {
    setEditedName(user.nombre || '')
    setIsEditing(true)
  }

  const handleSaveName = () => {
    console.log("Saving name:", editedName)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedName("")
  }

  const handleOpenPaymentPortal = async () => {
    if (!user.tenantId) {
      toast({ title: "Sin tenant", description: "No se encontró el tenant actual." })
      return
    }

    try {
      setPortalLoading(true)
      const res = await fetch('/api/payments/lemon/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: user.tenantId })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo generar el portal de pago')
      }

      const data = await res.json()
      if (data.portalUrl) {
        window.open(data.portalUrl, '_blank', 'noopener')
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || 'No se pudo abrir el portal de pago', variant: "destructive" })
    } finally {
      setPortalLoading(false)
    }
  }

  const handleChangePlan = async (newPlan: 'basico' | 'profesional') => {
    if (!user.tenantId) {
      toast({ title: "Sin tenant", description: "No se encontró el tenant actual." })
      return
    }

    setPlanLoading(newPlan)
    try {
      const res = await fetch('/api/payments/lemon/subscription/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: user.tenantId, newPlan })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo actualizar el plan')
      }

      toast({ title: "Plan actualizado", description: `Se cambió al plan ${newPlan}.` })
      await refreshFeatures()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || 'No se pudo cambiar el plan', variant: "destructive" })
    } finally {
      setPlanLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user.tenantId) {
      toast({ title: "Sin tenant", description: "No se encontró el tenant actual." })
      return
    }

    const confirmCancel = window.confirm('¿Seguro que quieres cancelar la suscripción?')
    if (!confirmCancel) return

    setCancelLoading(true)
    try {
      const res = await fetch('/api/payments/lemon/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: user.tenantId })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cancelar la suscripción')
      }

      toast({ title: "Suscripción cancelada", description: data.message || 'Se canceló la suscripción.' })
      await refreshFeatures()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || 'No se pudo cancelar la suscripción', variant: "destructive" })
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">Configuración</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu perfil, configuración personal y {isAdmin ? 'plan de suscripción' : 'permisos'} - {user?.tenant?.name || 'Tu Empresa'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.rol || 'Usuario'}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="permissions">Permisos</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="plan">
                  <Crown className="h-4 w-4 mr-2" />
                  Plan
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Perfil de Usuario</span>
                    </CardTitle>
                    <CardDescription>Información personal y de cuenta</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre Completo</Label>
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <Input
                            id="nombre"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Ingresa tu nombre"
                          />
                          <Button size="sm" onClick={handleSaveName}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <Input id="nombre" value={user.nombre} disabled />
                          <Button size="sm" variant="outline" onClick={handleEditName} className="ml-2 bg-transparent">
                            Editar
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input id="email" value={user.email} disabled />
                      <p className="text-xs text-muted-foreground">El correo electrónico no se puede modificar</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rol">Rol del Usuario</Label>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-sm">
                          {user.rol}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{userPermissions?.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span>Información de la Empresa</span>
                    </CardTitle>
                    <CardDescription>Detalles de tu organización</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenant-nombre">Nombre de la Empresa</Label>
                      <Input id="tenant-nombre" value={user.tenant?.name || 'No disponible'} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant-tipo">Tipo de Cultivo</Label>
                      <Input id="tenant-tipo" value={(user.tenant as any)?.primary_crop || 'No disponible'} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant-id">ID de Tenant</Label>
                      <Input id="tenant-id" value={user.tenantId || ''} disabled />
                      <p className="text-xs text-muted-foreground">Identificador único de tu organización</p>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Información</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        La información de la empresa es gestionada por el administrador del sistema y no puede ser modificada
                        desde esta interfaz.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Información del Sistema</span>
                  </CardTitle>
                  <CardDescription>Detalles técnicos y de configuración</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Configuración Actual</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Versión del Sistema:</span>
                          <span>v2.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Última Actualización:</span>
                          <span>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sesión Iniciada:</span>
                          <span>{new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Soporte y Ayuda</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          Si necesitas ayuda o tienes alguna pregunta sobre el sistema, contacta al administrador de tu
                          organización.
                        </p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Manual de Usuario
                          </Button>
                          <Button variant="outline" size="sm">
                            Contactar Soporte
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Permisos y Accesos</span>
                  </CardTitle>
                  <CardDescription>Módulos y funcionalidades disponibles para tu rol</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userPermissions?.permissions.map((permission: any) => (
                      <div
                        key={permission.module}
                        className={`p-4 border rounded-lg ${
                          permission.access ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{permission.module}</h4>
                          {permission.access ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{permission.description}</p>
                        <Badge variant={permission.access ? "default" : "destructive"} className="mt-2 text-xs">
                          {permission.access ? "Permitido" : "Restringido"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="plan" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Gestión de pago
                    </CardTitle>
                    <CardDescription>Actualiza el método de pago de tu suscripción</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={handleOpenPaymentPortal} disabled={portalLoading}>
                      {portalLoading && <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />}
                      Actualizar método de pago
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Se abrirá el portal de facturación de LemonSqueezy en una nueva pestaña.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Cambiar plan
                    </CardTitle>
                    <CardDescription>Actualiza el plan de suscripción para este tenant</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: 'basico', label: 'Básico' },
                        { key: 'profesional', label: 'Profesional' },
                      ].map((plan) => {
                        const isCurrent = currentPlanKey === plan.key
                        return (
                          <Button
                            key={plan.key}
                            variant={isCurrent ? 'outline' : 'default'}
                            disabled={isCurrent || planLoading === plan.key}
                            onClick={() => handleChangePlan(plan.key as 'basico' | 'profesional')}
                          >
                            {planLoading === plan.key && <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />}
                            {isCurrent ? `Plan actual: ${plan.label}` : `Cambiar a ${plan.label}`}
                          </Button>
                        )
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      El cambio puede generar prorrateos según las reglas de LemonSqueezy.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <Ban className="h-5 w-5" />
                      Cancelar suscripción
                    </CardTitle>
                    <CardDescription>Detén la renovación automática del plan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelLoading}>
                      {cancelLoading && <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />}
                      Cancelar suscripción
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Podrás reactivar antes de la fecha de término si cambias de opinión.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  )
}
