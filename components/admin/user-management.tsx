import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Trash2, UserPlus, Edit3, Shield, User, Package, DollarSign, Sprout, Mail, Phone, IdCard, Calendar, CheckCircle, Clock, XCircle, AlertCircle, AlertTriangle } from 'lucide-react'
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

interface InviteUserRequest {
  email: string
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
  const [editingRole, setEditingRole] = useState<'campo' | 'empaque' | 'finanzas'>('campo')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<TenantUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [canAddMoreUsers, setCanAddMoreUsers] = useState(true)
  const [userLimits, setUserLimits] = useState({ current: 0, max: 3 })
  const [tenantPlan, setTenantPlan] = useState('basic')

  const [formData, setFormData] = useState<InviteUserRequest>({
    email: '',
    role: 'campo'
  })

  const [errors, setErrors] = useState<Partial<InviteUserRequest>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [invitedUserEmail, setInvitedUserEmail] = useState('')

  const isAdmin = currentUser?.rol?.toLowerCase() === 'admin'

  // Helper function to get session with retry mechanism
  const getSessionWithRetry = async (retryCount = 0): Promise<any> => {
    const { supabase } = await import('../../lib/supabaseClient')
    let { data: { session } } = await supabase.auth.getSession()
    
    if (!session && retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return getSessionWithRetry(retryCount + 1)
    }
    
    return session
  }

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

  // Listen for user registration completions to refresh the list
  useEffect(() => {
    const handleUserRegistrationComplete = () => {
      loadUsers()
      checkUserLimits()
    }

    // Listen for storage events (when user completes registration in another tab)
    window.addEventListener('storage', (e) => {
      if (e.key === 'user_registration_complete') {
        handleUserRegistrationComplete()
      }
    })

    // Listen for custom events (same tab)
    window.addEventListener('userRegistrationComplete', handleUserRegistrationComplete)

    return () => {
      window.removeEventListener('storage', handleUserRegistrationComplete)
      window.removeEventListener('userRegistrationComplete', handleUserRegistrationComplete)
    }
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      const session = await getSessionWithRetry()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'No se encontró una sesión activa. Por favor, recarga la página.',
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
      const session = await getSessionWithRetry()
      
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

  const validateForm = async () => {
    const newErrors: Partial<InviteUserRequest> = {}
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido'
    } else {
      // Check if email already exists
      try {
        const session = await getSessionWithRetry()
        
        if (session) {
          const response = await fetch('/api/admin/check-email', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: formData.email })
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.exists) {
              newErrors.email = 'Ya existe un usuario con este email'
            }
          }
        }
      } catch (error) {
        console.error('Error checking email:', error)
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!(await validateForm())) return
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
      const session = await getSessionWithRetry()
      
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
          role: formData.role
        })
      })

      if (response.ok) {
        const result = await response.json()
        setInvitedUserEmail(formData.email)
        setShowSuccessMessage(true)
        setIsCreateModalOpen(false)
        
        // Auto-hide success message after 10 seconds
        setTimeout(() => {
          setShowSuccessMessage(false)
        }, 10000)
        setFormData({
          email: '',
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



  const handleDeleteUser = (user: TenantUser) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    setIsDeleting(true)

    try {
      const session = await getSessionWithRetry()
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'No se encontró una sesión activa',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch(`/api/admin/users?id=${userToDelete.membership?.user_id || userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      })

      if (response.ok) {
        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado permanentemente.",
          variant: "default"
        })
        setIsDeleteModalOpen(false)
        setUserToDelete(null)
        loadUsers() 
        checkUserLimits()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al eliminar el usuario",
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
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditUser = (user: TenantUser) => {
    setEditingUser(user)
    setEditingRole(user.role_code === 'admin' ? 'campo' : user.role_code)
    setIsEditModalOpen(true)
  }

  const handleUpdateUserRole = async () => {
    if (!editingUser) return

    setIsUpdating(true)
    try {
      const session = await getSessionWithRetry()
      
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
          userId: editingUser.membership?.user_id || editingUser.id,
          role: editingRole
        })
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Rol de usuario actualizado correctamente",
          variant: "default"
        })
        setIsEditModalOpen(false)
        setEditingUser(null)
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
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: "Error de conexión al actualizar el usuario",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
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
                Invitar Nuevo Usuario
              </DialogTitle>
              <DialogDescription>
                El usuario recibirá un email de invitación para configurar su cuenta
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email del Usuario</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                <p className="text-xs text-gray-500">
                  Se enviará una invitación a este email para completar el registro
                </p>
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
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    El rol de Finanzas está disponible en el plan profesional
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
                  {submitting ? 'Enviando invitación...' : 'Enviar Invitación'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Editar Rol de Usuario
            </DialogTitle>
            <DialogDescription>
              Cambiar el rol de {editingUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Nuevo Rol</Label>
              <Select value={editingRole} onValueChange={(value: 'campo' | 'empaque' | 'finanzas') => setEditingRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => {
                    const RoleIcon = roleIcons[role as keyof typeof roleIcons]
                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <RoleIcon className="h-4 w-4" />
                          {roleLabels[role as keyof typeof roleLabels]}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleDescriptions[editingRole as keyof typeof roleDescriptions]}
              </p>
              {tenantPlan === 'basic' && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  El rol de Finanzas está disponible en el plan profesional
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateUserRole}
                disabled={isUpdating}
              >
                {isUpdating ? 'Actualizando...' : 'Actualizar Rol'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Eliminar Usuario
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-800">
                    ¿Estás seguro que quieres eliminar a {userToDelete?.full_name}?
                  </p>
                  <p className="text-sm text-red-700">
                    La cuenta se eliminará permanentemente del sistema, incluyendo:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 ml-4">
                    <li>• Acceso a la plataforma</li>
                    <li>• Datos de perfil</li>
                    <li>• Historial de actividades</li>
                    <li>• Información de contacto</li>
                  </ul>
                  <p className="text-xs text-red-600 font-medium mt-3">
                    Esta acción es irreversible.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar Usuario'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                            } font-medium px-3 py-1 flex items-center gap-1`}
                          >
                            {user.status === 'active' ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Activo
                              </>
                            ) : user.status === 'pending' ? (
                              <>
                                <Clock className="h-3 w-3" />
                                Pendiente
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                Inactivo
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-gray-600 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-gray-600 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {user.phone}
                          </p>
                        )}
                        {user.document_id && (
                          <p className="text-gray-600 flex items-center gap-2">
                            <IdCard className="h-4 w-4 text-gray-400" />
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
                        onClick={() => handleDeleteUser(user)}
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
                      <Calendar className="h-4 w-4 text-gray-400" />
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
            <Button 
              disabled={!canAddMoreUsers}
              className="gap-2 bg-primary hover:bg-primary/90"
              size="lg"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <UserPlus className="h-5 w-5" />
              Crear Mi Primer Usuario
            </Button>
          </CardContent>
        </Card>
      )}
        </div>
      </main>
    </div>
  )
}