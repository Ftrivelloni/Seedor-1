import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Trash2, UserPlus, Edit3, Shield, User, Package, DollarSign, Sprout } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { toast } from '../../hooks/use-toast'
import type { AuthUser } from '../../lib/types'

interface TenantUser {
  id: string
  email: string
  full_name: string
  role_code: 'admin' | 'campo' | 'empaque' | 'finanzas'
  status: 'active' | 'pending' | 'inactive'
  created_at: string
  accepted_at?: string
  phone?: string
  document_id?: string
  membership?: {
    id: string
    role_code: string
    status: string
    user_id: string
    invited_by?: string
    accepted_at?: string
  }
}

interface CreateUserRequest {
  email: string
  password: string
  full_name: string
  document_id: string
  phone: string
  role: 'admin' | 'campo' | 'empaque' | 'finanzas'
}

interface UserManagementProps {
  currentUser: AuthUser
}

const roleIcons = {
  admin: Shield,
  campo: Sprout,
  empaque: Package,
  finanzas: DollarSign
}

const roleLabels = {
  admin: 'Administrador',
  campo: 'Campo',
  empaque: 'Empaque', 
  finanzas: 'Finanzas'
}

const roleDescriptions = {
  admin: 'Acceso completo a todas las funcionalidades',
  campo: 'Acceso a gestión de campo, trabajadores e inventario',
  empaque: 'Acceso a gestión de empaque e inventario',
  finanzas: 'Acceso a gestión de finanzas e inventario'
}

const roleBadgeColors = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  campo: 'bg-green-100 text-green-800 border-green-200',
  empaque: 'bg-blue-100 text-blue-800 border-blue-200',
  finanzas: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export function UserManagement({ currentUser }: UserManagementProps) {
  
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null)
  const [canAddMoreUsers, setCanAddMoreUsers] = useState(true)
  const [userLimits, setUserLimits] = useState({ current: 0, max: 3 })
  const [tenantPlan, setTenantPlan] = useState('basic')

  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    full_name: '',
    document_id: '',
    phone: '',
    role: 'campo'
  })

  const [errors, setErrors] = useState<Partial<CreateUserRequest>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [invitedUserEmail, setInvitedUserEmail] = useState('')

  const isAdmin = currentUser?.rol?.toLowerCase() === 'admin'

  // Available roles based on plan
  const availableRoles = {
    basic: ['campo', 'empaque'],
    profesional: ['campo', 'empaque', 'finanzas']
  }

  const roleOptions = tenantPlan === 'profesional' 
    ? availableRoles.profesional 
    : availableRoles.basic

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
      checkUserLimits()
    }
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      const { supabase } = await import('../../lib/supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'No se encontró una sesión activa',
          variant: 'destructive'
        })
        return
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const transformedUsers = (data.users || []).map((user: any) => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role_code: user.role_code,
          status: user.status,
          created_at: user.created_at,
          accepted_at: user.accepted_at,
          phone: user.phone,
          document_id: user.document_id,
          membership: user.membership
        }))
        setUsers(transformedUsers)
      } else {
        const errorData = await response.json()
        toast({
          title: 'Error al cargar usuarios',
          description: errorData.error || 'No se pudieron cargar los usuarios',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al cargar los usuarios',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkUserLimits = async () => {
    try {
      const { supabase } = await import('../../lib/supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setUserLimits({ current: users.length, max: 3 })
        setCanAddMoreUsers(users.length < 3)
        return
      }


      const response = await fetch(`/api/tenant/${currentUser.tenantId}/limits`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      
      if (response.ok) {
        const data = await response.json()
        setUserLimits({ current: data.current_users, max: data.max_users })
        setCanAddMoreUsers(data.can_add_more)
        setTenantPlan(data.plan || 'basic')
      } else {
        setUserLimits({ current: users.length, max: 3 })
        setCanAddMoreUsers(users.length < 3)
        setTenantPlan('basic')
      }
    } catch (error) {
      console.error('Error checking user limits:', error)
      setUserLimits({ current: users.length, max: 3 })
      setCanAddMoreUsers(users.length < 3)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserRequest> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nombre completo es requerido'
    }

    if (!formData.document_id.trim()) {
      newErrors.document_id = 'El documento de identidad es requerido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!canAddMoreUsers) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado el límite de usuarios para tu plan actual.",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    
    try {
      const { supabase } = await import('../../lib/supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'No se encontró una sesión activa',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.full_name,
          role: formData.role,
          documentId: formData.document_id,
          phone: formData.phone
        })
      })

      if (response.ok) {
        const result = await response.json()
        setInvitedUserEmail(formData.email)
        setShowSuccessMessage(true)
        setIsCreateModalOpen(false)
        setFormData({
          email: '',
          password: '',
          full_name: '',
          document_id: '',
          phone: '',
          role: 'campo'
        })
        loadUsers() 
        checkUserLimits()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al invitar al usuario",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: "Error",
        description: "Error de conexión al invitar al usuario",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
      return
    }

    try {
      const { supabase } = await import('../../lib/supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'No se encontró una sesión activa',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      })

      if (response.ok) {
        toast({
          title: "Usuario desactivado",
          description: "El usuario ha sido desactivado exitosamente."
        })
        loadUsers() 
        checkUserLimits()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al desactivar el usuario",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: "Error de conexión al eliminar el usuario",
        variant: "destructive"
      })
    }
  }

  const handleEditUser = (user: TenantUser) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'No se encontró una sesión activa',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          workerId: userId,
          role: newRole 
        })
      })

      if (response.ok) {
        toast({
          title: "Rol actualizado",
          description: "El rol del usuario ha sido actualizado exitosamente."
        })
        loadUsers() 
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al actualizar el rol del usuario",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: "Error",
        description: "Error de conexión al actualizar el rol",
        variant: "destructive"
      })
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Solo los administradores pueden gestionar usuarios.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-gradient-to-r from-white to-gray-50">
          <div className="flex h-20 items-center justify-between px-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestión de Usuarios</h1>
              <p className="text-sm text-gray-600">Cargando información de usuarios...</p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary"></div>
                <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-r-primary/30 animate-ping"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Cargando usuarios...</p>
              <p className="text-sm text-gray-500">Por favor espera un momento</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-gradient-to-r from-white to-gray-50">
        <div className="flex h-20 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestión de Usuarios</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {userLimits.current}/{userLimits.max === -1 ? '∞' : userLimits.max} usuarios
                </span>
                <span className="text-gray-400">•</span>
                <span className="font-medium">{currentUser?.tenant?.name || 'Tu Empresa'}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{currentUser?.nombre || currentUser?.email}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {currentUser?.rol || 'Usuario'}
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Equipo de Trabajo</h2>
          <p className="text-sm text-gray-600">Gestiona los usuarios que tienen acceso a tu sistema</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={!canAddMoreUsers}
              className="gap-2 bg-primary hover:bg-primary/90 shadow-sm"
              size="lg"
            >
              <UserPlus className="h-5 w-5" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Crear Nuevo Usuario
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Invita a un nuevo miembro para que se una a tu equipo
              </p>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Juan Pérez"
                />
                {errors.full_name && <p className="text-sm text-red-600">{errors.full_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="juan@empresa.com"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="document_id">Documento de Identidad</Label>
                <Input
                  id="document_id"
                  value={formData.document_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_id: e.target.value }))}
                  placeholder="12345678"
                />
                {errors.document_id && <p className="text-sm text-red-600">{errors.document_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+56 9 1234 5678"
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(role => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {roleIcons[role as keyof typeof roleIcons] && 
                            React.createElement(roleIcons[role as keyof typeof roleIcons], { className: "h-4 w-4" })
                          }
                          {roleLabels[role as keyof typeof roleLabels]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
                </p>
                {tenantPlan === 'basic' && (
                  <p className="text-xs text-amber-600">
                    💡 El rol de Finanzas está disponible en el plan profesional
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!canAddMoreUsers && userLimits.max !== -1 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>No se pueden crear más usuarios.</strong> Se llegó al límite de usuarios para tu plan actual ({userLimits.max} usuarios). 
            Para más usuarios debe mejorar al plan pro.
            <br />
            <Button variant="link" className="p-0 h-auto ml-0 mt-1 text-orange-700 hover:text-orange-900">
              Actualizar al Plan Pro →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showSuccessMessage && (
        <Alert className="border-green-200 bg-green-50">
          <UserPlus className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>¡Invitación enviada exitosamente!</strong>
            <br />
            Se ha enviado una invitación a <strong>{invitedUserEmail}</strong>. El usuario recibirá un email con las instrucciones para completar su registro.
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={() => setShowSuccessMessage(false)}
                className="bg-green-600 hover:bg-green-700"
              >
                Continuar gestionando usuarios
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => window.location.href = '/usuarios'}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Volver al módulo de usuarios
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {users.map((user) => {
          const RoleIcon = roleIcons[user.role_code]
          
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      user.role_code === 'admin' ? 'bg-red-100 text-red-600' :
                      user.role_code === 'campo' ? 'bg-green-100 text-green-600' :
                      user.role_code === 'empaque' ? 'bg-blue-100 text-blue-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      <RoleIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg text-gray-900">{user.full_name || 'Sin nombre'}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={`${roleBadgeColors[user.role_code]} font-medium px-3 py-1`}>
                            {roleLabels[user.role_code]}
                          </Badge>
                          <Badge 
                            variant={user.status === 'active' ? 'default' : 'secondary'}
                            className={`${
                              user.status === 'active' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : user.status === 'pending' 
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            } font-medium px-3 py-1`}
                          >
                            {user.status === 'active' ? '✅ Activo' : 
                             user.status === 'pending' ? '⏳ Pendiente' : '❌ Inactivo'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-gray-600 flex items-center gap-2">
                          <span className="text-gray-400">📧</span>
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-gray-600 flex items-center gap-2">
                            <span className="text-gray-400">📱</span>
                            {user.phone}
                          </p>
                        )}
                        {user.document_id && (
                          <p className="text-gray-600 flex items-center gap-2">
                            <span className="text-gray-400">🆔</span>
                            {user.document_id}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {user.email !== currentUser.email && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id)}
                        className="hover:bg-red-50 hover:border-red-200 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
                
                {user.accepted_at && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="text-gray-400">📅</span>
                      Se unió el {new Date(user.accepted_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {users.length === 0 && !loading && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay usuarios registrados</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Aún no has creado usuarios para tu empresa. Comienza invitando a tu equipo para que puedan acceder a los diferentes módulos.
            </p>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!canAddMoreUsers}
                  className="gap-2 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <UserPlus className="h-5 w-5" />
                  Crear Mi Primer Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                </DialogHeader>
                {/* Form content will be here - same as current */}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
        </div>
      </main>
    </div>
  )
}