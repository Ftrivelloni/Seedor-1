"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { useAuth } from "../../hooks/use-auth"
import { PlanManagement } from "../admin/plan-management"
import { FeatureProvider } from "../../lib/features-context"
import { User, Building, Shield, Settings, Info, CheckCircle, XCircle, Crown } from "lucide-react"

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

export function EnhancedAjustesPage() {
  const { user, loading: authLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")

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

  const userPermissions = rolePermissions[user.rol as keyof typeof rolePermissions]
  const isAdmin = user.rol.toLowerCase() === 'admin'

  const handleEditName = () => {
    setEditedName(user.nombre)
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

  return (
    <FeatureProvider user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Configuración</h1>
            <p className="text-muted-foreground">
              Gestiona tu perfil, configuración personal y {isAdmin ? 'plan de suscripción' : 'permisos'}
            </p>
          </div>
        </div>

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
                    <Input id="tenant-tipo" value={user.tenant?.primary_crop || 'No disponible'} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenant-id">ID de Tenant</Label>
                    <Input id="tenant-id" value={user.tenantId} disabled />
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
              <PlanManagement currentUser={user} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </FeatureProvider>
  )
}