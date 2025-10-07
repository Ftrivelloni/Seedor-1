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
import type { AuthUser } from '../../lib/supabaseAuth'

interface TenantUser {
  id: string
  email: string
  full_name: string
  role_code: 'admin' | 'campo' | 'empaque' | 'finanzas'
  status: 'active' | 'pending' | 'inactive'
  created_at: string
  accepted_at?: string
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

  const isAdmin = currentUser.rol.toLowerCase() === 'admin'

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
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const transformedUsers = (data.users || []).map((worker: any) => ({
          id: worker.id,
          email: worker.email,
          full_name: worker.full_name,
          role_code: worker.membership?.role_code || worker.area_module,
          status: worker.status,
          created_at: worker.created_at,
          accepted_at: worker.membership?.accepted_at
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
      const response = await fetch(`/api/tenants/${currentUser.tenantId}/limits`)
      if (response.ok) {
        const data = await response.json()
        setUserLimits({ current: data.current_users, max: data.max_users })
        setCanAddMoreUsers(data.current_users < data.max_users)
      } else {
        setUserLimits({ current: users.length, max: 3 })
        setCanAddMoreUsers(users.length < 3)
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
        toast({
          title: "Usuario invitado",
          description: result.message || "El usuario ha sido invitado exitosamente."
        })
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
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">Gestión de Usuarios</h1>
            <p className="text-sm text-muted-foreground">
              Usuarios activos: {userLimits.current} de {userLimits.max} - {currentUser?.tenant?.name || 'Tu Empresa'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser?.nombre || currentUser?.email}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.rol || 'Usuario'}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
      <div className="flex justify-end">
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={!canAddMoreUsers}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
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
                    <SelectItem value="campo">Campo</SelectItem>
                    <SelectItem value="empaque">Empaque</SelectItem>
                    <SelectItem value="finanzas">Finanzas</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {roleDescriptions[formData.role]}
                </p>
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

      {!canAddMoreUsers && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Has alcanzado el límite de usuarios para tu plan actual ({userLimits.max} usuarios). 
            <Button variant="link" className="p-0 h-auto ml-1">
              Actualizar plan
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {users.map((user) => {
          const RoleIcon = roleIcons[user.role_code]
          
          return (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gray-100">
                      <RoleIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={roleBadgeColors[user.role_code]}>
                      {roleLabels[user.role_code]}
                    </Badge>
                    
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Activo' : 
                       user.status === 'pending' ? 'Pendiente' : 'Inactivo'}
                    </Badge>
                    
                    {user.email !== currentUser.email && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay usuarios registrados</p>
          </CardContent>
        </Card>
      )}
        </div>
      </main>
    </div>
  )
}