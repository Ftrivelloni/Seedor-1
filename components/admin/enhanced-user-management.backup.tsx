"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSessionTimeout } from '../../hooks/use-session-timeout'
import { memoryCache } from '../../hooks/use-memory-cache'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Switch } from '../ui/switch'
import { 
  Trash2, UserPlus, Edit3, Shield, User, Package, DollarSign, 
  Sprout, AlertCircle, Check, Lock, Eye, EyeOff, AlertTriangle
} from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { toast } from '../../hooks/use-toast'
import type { AuthUser } from '../../lib/auth'

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
  full_name: string
  document_id: string
  phone: string
  role: 'admin' | 'campo' | 'empaque' | 'finanzas'
}

interface RolePermission {
  module: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
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

// Define role permissions for each module
const rolePermissions: Record<string, RolePermission[]> = {
  admin: [
    { module: 'dashboard', label: 'Dashboard', description: 'Acceso al panel principal', icon: User },
    { module: 'campo', label: 'Campo', description: 'Gestión de campos y cultivos', icon: Sprout },
    { module: 'empaque', label: 'Empaque', description: 'Gestión de empaque y procesamiento', icon: Package },
    { module: 'finanzas', label: 'Finanzas', description: 'Gestión financiera y contable', icon: DollarSign },
    { module: 'inventario', label: 'Inventario', description: 'Control de inventario y stock', icon: Package },
    { module: 'trabajadores', label: 'Trabajadores', description: 'Gestión de personal', icon: User },
    { module: 'contactos', label: 'Contactos', description: 'Gestión de clientes y proveedores', icon: User },
    { module: 'ajustes', label: 'Ajustes', description: 'Configuración del sistema', icon: User },
    { module: 'user_management', label: 'Usuarios', description: 'Gestión de usuarios y permisos', icon: Shield },
  ],
  campo: [
    { module: 'dashboard', label: 'Dashboard', description: 'Acceso al panel principal', icon: User },
    { module: 'campo', label: 'Campo', description: 'Gestión de campos y cultivos', icon: Sprout },
    { module: 'inventario', label: 'Inventario', description: 'Control de inventario y stock', icon: Package },
    { module: 'trabajadores', label: 'Trabajadores', description: 'Gestión de personal', icon: User },
    { module: 'ajustes', label: 'Ajustes', description: 'Configuración del sistema', icon: User },
  ],
  empaque: [
    { module: 'dashboard', label: 'Dashboard', description: 'Acceso al panel principal', icon: User },
    { module: 'empaque', label: 'Empaque', description: 'Gestión de empaque y procesamiento', icon: Package },
    { module: 'inventario', label: 'Inventario', description: 'Control de inventario y stock', icon: Package },
    { module: 'trabajadores', label: 'Trabajadores', description: 'Gestión de personal', icon: User },
    { module: 'ajustes', label: 'Ajustes', description: 'Configuración del sistema', icon: User },
  ],
  finanzas: [
    { module: 'dashboard', label: 'Dashboard', description: 'Acceso al panel principal', icon: User },
    { module: 'finanzas', label: 'Finanzas', description: 'Gestión financiera y contable', icon: DollarSign },
    { module: 'inventario', label: 'Inventario', description: 'Control de inventario y stock', icon: Package },
    { module: 'trabajadores', label: 'Trabajadores', description: 'Gestión de personal', icon: User },
    { module: 'ajustes', label: 'Ajustes', description: 'Configuración del sistema', icon: User },
  ]
}

export function EnhancedUserManagement({ currentUser }: UserManagementProps) {
  // State initialization
  const [users, setUsers] = useState<TenantUser[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  
  // Use session timeout hook for better session management
  const { refreshSessionToken, getSessionToken, callApiWithSession } = useSessionTimeout();
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null)
  const [canAddMoreUsers, setCanAddMoreUsers] = useState(true)
  const [userLimits, setUserLimits] = useState({ current: 0, max: 3 })

  // Form state
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    full_name: '',
    document_id: '',
    phone: '',
    role: 'campo'
  })

  const [errors, setErrors] = useState<Partial<CreateUserRequest>>({})
  const [submitting, setSubmitting] = useState(false)

  // Check if current user is admin
  const isAdmin = currentUser.rol?.toLowerCase() === 'admin'

  // Enhanced users loading with cache and memoization
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use callApiWithSession to handle token management and retries
      await callApiWithSession(async (token) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Fetching users from API with token...');
        }
        const apiUrl = '/api/admin/users';
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('API Response status:', response.status);
        }
        
        if (!response.ok) {
          // Handle error response
          const errorText = await response.text();
          let errorMessage = `API no disponible (Error ${response.status})`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.details 
              ? `${errorData.error}: ${errorData.details}`
              : errorData.error || 'Error desconocido';
              
            console.error('API error details:', errorData);
          } catch (e) {
            console.error('Failed to parse API error:', e);
            errorMessage = `Error ${response.status}: ${errorText}`;
          }
          
          toast({
            title: 'Error al cargar usuarios',
            description: errorMessage,
            variant: 'destructive'
          });
          
          setUsers([]);
          return;
        }
        
        // Process successful response
        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('Users data received:', data);
        }
        
        if (!data.users || !Array.isArray(data.users)) {
          console.error('Invalid users data structure:', data);
          toast({
            title: 'Error de formato',
            description: 'La API devolvió datos en un formato incorrecto',
            variant: 'destructive'
          });
          setUsers([]);
          return;
        }
        
        // Transform workers data to match TenantUser interface
        const transformedUsers = data.users.map((worker: any) => ({
          id: worker.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
          email: worker.email || 'email@desconocido.com',
          full_name: worker.full_name || worker.nombre || worker.email?.split('@')[0] || 'Usuario Desconocido',
          role_code: worker.membership?.role_code || worker.area_module || 'unknown',
          status: worker.status || 'active',
          created_at: worker.created_at || new Date().toISOString(),
          accepted_at: worker.membership?.accepted_at
        }));
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Transformed users:', transformedUsers);
        }
        setUsers(transformedUsers);
        
        // Show success notification when users are loaded
        if (transformedUsers.length > 0) {
          toast({
            title: 'Datos cargados',
            description: `Se han cargado ${transformedUsers.length} usuarios correctamente`,
            variant: 'default'
          });
        }
      }, 2); // Allow 2 retries
    } catch (error) {
      console.error('Error in loadUsers:', error);
      toast({
        title: 'Error de conexión',
        description: 'Ocurrió un error al cargar los usuarios: ' + (error instanceof Error ? error.message : 'Error desconocido'),
        variant: 'destructive'
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [callApiWithSession, toast]);

  // Enhanced limits checking with memoization and caching
  const checkUserLimits = useCallback(async () => {
    try {
      // Check tenant plan limits
      if (!currentUser?.tenantId) {
        console.error('No tenant ID available');
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Checking user limits for tenant:', currentUser.tenantId);
      }
      
      // Use callApiWithSession to handle token management and retries
      await callApiWithSession(async (token) => {
        const limitsUrl = `/api/tenant/${currentUser.tenantId}/limits`;
        if (process.env.NODE_ENV === 'development') {
          console.log('Fetching from:', limitsUrl);
        }
        
        const response = await fetch(limitsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Limits API response status:', response.status);
        }
        
        if (response.ok) {
          const data = await response.json();
          if (process.env.NODE_ENV === 'development') {
            console.log('Limits data received:', data);
          }
          setUserLimits({ current: data.current_users, max: data.max_users });
          setCanAddMoreUsers(data.current_users < data.max_users || data.can_add_more);
        } else {
          let errorMessage = `API no disponible (Error ${response.status})`;
          try {
            const errorText = await response.text();
            console.error('Error response from limits API:', response.status, errorText);
            
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(errorText);
              console.error('Limits API error details:', errorData);
              errorMessage = errorData.error || 'Error desconocido';
            } catch (e) {
              // Not JSON, leave as text
              errorMessage = errorText || `Error ${response.status}`;
            }
          } catch (e) {
            console.error('Failed to read limits API error response:', e);
          }
          
          toast({
            title: 'Error al verificar límites',
            description: `API error: ${errorMessage}`,
            variant: 'destructive'
          });
          
          // Default values
          setUserLimits({ current: 1, max: 1 });
          setCanAddMoreUsers(false);
        }
      }, 1); // Allow 1 retry
    } catch (error) {
      console.error('Error checking user limits:', error);
      toast({
        title: 'Error de conexión',
        description: 'Error al verificar límites de usuarios: ' + (error instanceof Error ? error.message : 'Error desconocido'),
        variant: 'destructive'
      });
      // Default values
      setUserLimits({ current: 1, max: 1 });
      setCanAddMoreUsers(false);
    }
  }, [currentUser?.tenantId, callApiWithSession, toast]);

  // Memoized session token setup
  const setupSession = useCallback(async () => {
    try {
      const { supabase } = await import('../../lib/supabaseClient')
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Store in sessionStorage for fallback
        sessionStorage.setItem('accessToken', session.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to store access token:', error);
      return false;
    }
  }, []);

  // Store access token when available and load initial data
  useEffect(() => {
    if (isAdmin) {
      // Use Promise.all to run operations in parallel
      (async () => {
        await setupSession();
        
        // Load data in parallel
        await Promise.all([
          loadUsers(),
          checkUserLimits()
        ]);
      })();
    }
  }, [isAdmin, setupSession, loadUsers, checkUserLimits]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserRequest> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido'
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

  const handleInviteUser = async (e: React.FormEvent) => {
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
      // Use callApiWithSession to handle token management and retries
      await callApiWithSession(async (token) => {
        const response = await fetch('/api/admin/users/invite', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            fullName: formData.full_name,
            role: formData.role,
            documentId: formData.document_id,
            phone: formData.phone
          })
        });

        if (response.ok) {
          const result = await response.json()
          toast({
            title: "Usuario invitado",
            description: "Se ha enviado un correo de invitación para completar el registro."
          })
          setIsCreateModalOpen(false)
          setFormData({
            email: '',
            full_name: '',
            document_id: '',
            phone: '',
            role: 'campo'
          })
          loadUsers() // Reload the user list
          checkUserLimits()
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Error al invitar al usuario",
            variant: "destructive"
          })
        }
      }, 1); // Allow 1 retry
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
      // Use callApiWithSession to handle token management and retries
      await callApiWithSession(async (token) => {
        const response = await fetch(`/api/admin/users?id=${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          toast({
            title: "Usuario desactivado",
            description: "El usuario ha sido desactivado exitosamente."
          })
          loadUsers() // Reload the user list
          checkUserLimits()
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Error al desactivar el usuario",
            variant: "destructive"
          })
        }
      }, 1); // Allow 1 retry
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
    setFormData({
      ...formData,
      email: user.email,
      full_name: user.full_name,
      role: user.role_code,
      document_id: '', // We don't have this information from the API
      phone: '', // We don't have this information from the API
    })
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      // Use callApiWithSession to handle token management and retries
      await callApiWithSession(async (token) => {
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            workerId: userId,
            role: newRole 
          })
        });

        if (response.ok) {
          toast({
            title: "Rol actualizado",
            description: "El rol del usuario ha sido actualizado exitosamente."
          })
          setIsEditModalOpen(false)
          loadUsers() // Reload the user list
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Error al actualizar el rol del usuario",
            variant: "destructive"
          })
        }
      }, 1); // Allow 1 retry
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: "Error",
        description: "Error de conexión al actualizar el rol",
        variant: "destructive"
      })
    }
  }

  // Filter users based on active tab with memoization to prevent unnecessary recalculations
  const filteredUsers = useMemo(() => users.filter(user => {
    if (activeTab === 'all') return true;
    if (activeTab === 'admin') return user.role_code === 'admin';
    if (activeTab === 'campo') return user.role_code === 'campo';
    if (activeTab === 'empaque') return user.role_code === 'empaque';
    if (activeTab === 'finanzas') return user.role_code === 'finanzas';
    if (activeTab === 'active') return user.status === 'active';
    if (activeTab === 'pending') return user.status === 'pending';
    return true;
  }), [users, activeTab]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert className="bg-red-50 text-red-800 border border-red-200">
            <AlertCircle className="h-4 w-4" />
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
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold">Gestión de Usuarios</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">Gestión de Usuarios</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={async () => {
                toast({
                  title: "Actualizando",
                  description: "Actualizando datos de usuarios..."
                });
                await refreshSessionToken();
                await Promise.all([loadUsers(), checkUserLimits()]);
              }}
              className="mr-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
              Actualizar
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowPermissions(!showPermissions)}
              >
                {showPermissions ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPermissions ? 'Ocultar permisos' : 'Ver permisos de roles'}
              </Button>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser?.nombre || currentUser?.email}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.rol || 'Usuario'}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Role permissions explainer */}
          {showPermissions && (
            <Card>
              <CardHeader>
                <CardTitle>Permisos de Roles de Usuario</CardTitle>
                <CardDescription>
                  Cada rol tiene acceso específico a diferentes módulos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <Card key={role} className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {React.createElement(roleIcons[role as keyof typeof roleIcons], { className: "h-5 w-5" })}
                          <span>{label}</span>
                        </CardTitle>
                        <CardDescription>{roleDescriptions[role as keyof typeof roleDescriptions]}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <h4 className="font-medium text-sm mb-2">Acceso a módulos:</h4>
                        <div className="space-y-2">
                          {rolePermissions[role].map(perm => (
                            <div key={perm.module} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{perm.label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Alert className="bg-blue-50 text-blue-800 border border-blue-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <p><strong>Nota:</strong> Además de estos permisos por rol, el acceso a los módulos también depende del plan contratado.</p>
                    <p className="mt-1">Por ejemplo, un usuario con rol "Campo" no podrá acceder al módulo de Finanzas aunque el tenant tenga el plan Pro.</p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
          
          {/* Tabs y botón crear usuario */}
          <div className="flex justify-between items-center">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="admin">Administradores</TabsTrigger>
                <TabsTrigger value="campo">Campo</TabsTrigger>
                <TabsTrigger value="empaque">Empaque</TabsTrigger>
                <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
                <TabsTrigger value="active">Activos</TabsTrigger>
                <TabsTrigger value="pending">Pendientes</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!canAddMoreUsers}
                  className="gap-2 ml-4"
                >
                  <UserPlus className="h-4 w-4" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
                  <CardDescription className="pt-2">
                    Se enviará una invitación por correo electrónico al usuario para que complete su registro con sus datos personales y cree su propia contraseña.
                  </CardDescription>
                </DialogHeader>
                
                <form onSubmit={handleInviteUser} className="space-y-4">
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
                      {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
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
                      {submitting ? 'Enviando invitación...' : 'Enviar invitación'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* User limit warning */}
          {!canAddMoreUsers && (
            <Alert className="bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-800">
                Has alcanzado el límite de usuarios para tu plan actual ({userLimits.max} usuarios). 
                <Button variant="link" className="p-0 h-auto ml-1 text-amber-600">
                  Actualizar plan
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Users list */}
          <div className="grid gap-4">
            {filteredUsers.map((user) => {
              // Provide a fallback icon if the role code doesn't match any defined icons
              const RoleIcon = roleIcons[user.role_code] || User
              
              return (
                <Card key={user.id} className={user.status === 'inactive' ? 'opacity-70' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${user.status === 'inactive' ? 'bg-gray-200' : 'bg-gray-100'}`}>
                          <RoleIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium">{user.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.status === 'pending' && (
                            <div className="flex items-center text-xs text-amber-600 mt-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span>Invitación pendiente</span>
                            </div>
                          )}
                          {user.status === 'inactive' && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Lock className="h-3 w-3 mr-1" />
                              <span>Usuario desactivado</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={roleBadgeColors[user.role_code] || 'bg-gray-100 text-gray-800 border-gray-200'}>
                          {roleLabels[user.role_code as keyof typeof roleLabels] || user.role_code || 'Usuario'}
                        </Badge>
                        
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Activo' : 
                          user.status === 'pending' ? 'Pendiente' : 'Inactivo'}
                        </Badge>
                        
                        {user.email !== currentUser.email && user.status !== 'inactive' && (
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

          {/* Edit user dialog */}
          {editingUser && (
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Usuario</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Usuario</Label>
                    <div className="text-base">{editingUser.full_name}</div>
                    <div className="text-sm text-muted-foreground">{editingUser.email}</div>
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
                      {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
                    </p>
                  </div>

                  {/* Role permissions summary */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Permisos para este rol</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        {useMemo(() => rolePermissions[formData.role]?.map(perm => (
                          <div key={perm.module} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-sm">{perm.label}</span>
                          </div>
                        )), [formData.role])}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => handleUpdateUserRole(editingUser.id, formData.role)} 
                      disabled={submitting || formData.role === editingUser.role_code}
                    >
                      {submitting ? 'Actualizando...' : 'Actualizar Rol'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                {activeTab === 'all' ? (
                  <>
                    <p className="text-muted-foreground mb-4">No hay usuarios registrados</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        toast({
                          title: "Sesión refrescada",
                          description: "Intentando recargar datos con una sesión nueva..."
                        });
                        await refreshSessionToken();
                        await Promise.all([loadUsers(), checkUserLimits()]);
                      }}
                    >
                      Refrescar sesión y reintentar
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">No se encontraron usuarios con este filtro</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}