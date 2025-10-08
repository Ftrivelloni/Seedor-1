"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Check, Loader2, Settings, UserPlus, CheckCircle,
  MapPin, Package, DollarSign
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { authService } from "../lib/supabaseAuth";
import UserSetupForm from "./user-setup-form";

const inputStrong = "h-12 bg-white border-2 border-slate-200 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#81C101]/30 focus-visible:border-[#81C101] transition-all duration-200";

const AVAILABLE_MODULES = {
  campo: {
    id: 'campo',
    name: 'Campo',
    description: 'Gestión de tareas de campo, cultivos y lotes',
    icon: MapPin,
    color: 'text-green-600',
    available: ['basico', 'profesional']
  },
  empaque: {
    id: 'empaque',
    name: 'Empaque',
    description: 'Control de procesamiento y empaque de productos',
    icon: Package,
    color: 'text-blue-600',
    available: ['basico', 'profesional']
  },
  finanzas: {
    id: 'finanzas',
    name: 'Finanzas',
    description: 'Gestión de caja chica y movimientos financieros',
    icon: DollarSign,
    color: 'text-purple-600',
    available: ['profesional']
  }
};

export default function AdminSetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [currentStep, setCurrentStep] = useState<'worker-info' | 'modules' | 'invite-users' | 'complete'>('worker-info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invitation, setInvitation] = useState<any>(null);
  const [tenantPlan, setTenantPlan] = useState<string>('');
  const [availableModules, setAvailableModules] = useState<string[]>([]);

  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [moduleInvitations, setModuleInvitations] = useState<Record<string, string>>({});
  const [invitingUsers, setInvitingUsers] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) {
        setError("Token inválido");
        setLoading(false);
        return;
      }

      try {
        console.log('🔧 AdminSetupForm: Checking if user is already authenticated...');
        // Primero verificar si el usuario ya está autenticado
        const { user: currentUser } = await authService.getSafeSession();
        
        console.log('🔧 AdminSetupForm: Session result:', {
          hasUser: !!currentUser,
          tenantId: currentUser?.tenantId,
          rol: currentUser?.rol
        });
        
        if (currentUser && currentUser.tenantId && currentUser.rol === 'admin') {

          // El usuario ya está autenticado como admin, usar datos de la sesión
          const mockInvitation = {
            tenant_id: currentUser.tenantId,
            role: currentUser.rol,
            tenants: currentUser.tenant
          };
          
          setInvitation(mockInvitation);

          console.log('🔧 AdminSetupForm: Getting tenant limits for:', currentUser.tenantId);
          const { success: limitsSuccess, data: limitsData } = await authService.getTenantLimits(currentUser.tenantId);
          
          console.log('🔧 AdminSetupForm: Tenant limits result:', { limitsSuccess, limitsData });
          
          if (limitsSuccess && limitsData) {
            setTenantPlan(limitsData.plan);
            const available = Object.keys(AVAILABLE_MODULES).filter(moduleId => 
              AVAILABLE_MODULES[moduleId as keyof typeof AVAILABLE_MODULES].available.includes(limitsData.plan)
            );
            setAvailableModules(available);
          }


          setLoading(false);
          return;
        }

        console.log('⚠️ AdminSetupForm: User not authenticated as admin, falling back to token lookup');

        // Si no está autenticado, buscar la invitación por token (flujo original)
        const { success, data, error: inviteError } = await authService.getInvitationByToken(token);
        
        if (!success || !data) {
          setError(inviteError || "Invitación no encontrada");
          setLoading(false);
          return;
        }

        setInvitation(data);

        const { success: limitsSuccess, data: limitsData } = await authService.getTenantLimits(data.tenant_id);
        
        if (limitsSuccess && limitsData) {
          setTenantPlan(limitsData.plan);
          
          const available = Object.keys(AVAILABLE_MODULES).filter(moduleId => 
            AVAILABLE_MODULES[moduleId as keyof typeof AVAILABLE_MODULES].available.includes(limitsData.plan)
          );
          setAvailableModules(available);
        }

      } catch (err: any) {
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [token]);

  const handleWorkerInfoComplete = (workerData: any) => {
    setAdminData(workerData);
    setCurrentStep('modules');
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const onSubmitModules = () => {
    if (selectedModules.length === 0) {
      setError("Seleccioná al menos un módulo");
      return;
    }
    setError(null);
    setCurrentStep('invite-users');
  };

  const onFinishSetup = async () => {
    setInvitingUsers(true);
    setError(null);

    try {
      // Validar emails antes de enviar invitaciones
      const emailValidationErrors = [];
      for (const [moduleId, email] of Object.entries(moduleInvitations)) {
        if (selectedModules.includes(moduleId) && email.trim()) {
          if (!email.includes('@') || !email.includes('.')) {
            emailValidationErrors.push(`Email inválido para ${AVAILABLE_MODULES[moduleId as keyof typeof AVAILABLE_MODULES].name}: ${email}`);
          }
        }
      }

      if (emailValidationErrors.length > 0) {
        setError(emailValidationErrors.join('\n'));
        return;
      }

      // Enviar invitaciones a usuarios de módulos
      const invitationPromises = Object.entries(moduleInvitations)
        .filter(([moduleId, email]) => selectedModules.includes(moduleId) && email.trim())
        .map(async ([moduleId, email]) => {
          const response = await fetch('/api/auth/invite-module-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tenantId: invitation.tenant_id,
              email: email.trim(),
              roleCode: moduleId, 
              invitedBy: invitation.invited_by
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.warn(`Error inviting user for ${moduleId}:`, errorData.error);
          }
        });

      await Promise.all(invitationPromises);

      // Habilitar módulos
      await fetch('/api/admin/enable-modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: invitation.tenant_id,
          modules: selectedModules
        })
      });

      // Finalizar aceptando la invitación de admin
      if (typeof window !== 'undefined') {
        const authData = sessionStorage.getItem('admin_auth_data');
        if (authData) {
          const data = JSON.parse(authData);



          const { success, error: acceptError } = await authService.acceptInvitationWithSetup({
            token,
            userData: {
              fullName: data.fullName,
              phone: data.phone,
              password: data.password // ✅ La contraseña establecida en el primer paso
            }
          });

          if (!success) {
            setError(acceptError || "Error al finalizar la configuración de administrador");
            return;
          }

          sessionStorage.removeItem('admin_auth_data');

        }
      }


      
      // Cerrar sesión para evitar inconsistencias

      await authService.logout();
      
      setCurrentStep('complete');

    } catch (err: any) {
      setError(err.message || "Error al finalizar configuración");
    } finally {
      setInvitingUsers(false);
    }
  };

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="size-12 animate-spin text-[#81C101] mb-4" />
            <p className="text-slate-600">Cargando configuración...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !invitation) {
    return (
      <Card className="mx-auto w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-800">Error</CardTitle>
          <CardDescription className="text-red-600 mt-2">
            {error}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pt-4">
          <Button onClick={() => router.push("/login")}>
            Ir al inicio de sesión
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (currentStep === 'complete') {
    return (
      <Card className="mx-auto w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <Check className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">¡Configuración completa!</CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            Ahora podés iniciar sesión como administrador de <strong className="text-[#81C101]">{invitation?.tenants?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4">
            <p className="font-semibold text-slate-800 mb-2">Módulos habilitados:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedModules.map(moduleId => {
                const module = AVAILABLE_MODULES[moduleId as keyof typeof AVAILABLE_MODULES];
                const Icon = module.icon;
                return (
                  <span key={moduleId} className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-[#81C101]/10 text-[#81C101]">
                    <Icon className="size-4" />
                    {module.name}
                  </span>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center pt-4">
          <Button 
            onClick={() => router.push("/login")}
            className="bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Ir al inicio de sesión
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (currentStep === 'worker-info') {
    return (
      <UserSetupForm 
        userType="admin" 
        onComplete={handleWorkerInfoComplete}
      />
    );
  }

  if (currentStep === 'modules') {
    return (
      <Card className="mx-auto w-full max-w-2xl rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <Settings className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Seleccioná los módulos</CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            Elegí qué módulos querés activar para tu plan <strong className="text-[#81C101]">{tenantPlan}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableModules.map(moduleId => {
              const module = AVAILABLE_MODULES[moduleId as keyof typeof AVAILABLE_MODULES];
              const Icon = module.icon;
              const isSelected = selectedModules.includes(moduleId);
              
              return (
                <div
                  key={moduleId}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                    isSelected 
                      ? 'border-[#81C101] bg-[#81C101]/5 shadow-md' 
                      : 'border-slate-200 hover:border-[#81C101]/40 hover:bg-slate-50'
                  }`}
                  onClick={() => handleModuleToggle(moduleId)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleModuleToggle(moduleId)}
                        className="mt-1"
                      />
                    </div>
                    <div className={`rounded-lg p-2 ${isSelected ? 'bg-white/60' : 'bg-slate-100'}`}>
                      <Icon className={`size-6 ${module.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isSelected ? 'text-[#81C101]' : 'text-slate-800'}`}>
                        {module.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-6 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('worker-info')}
              className="flex-1 h-12 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              Volver
            </Button>
            <Button 
              onClick={onSubmitModules}
              className="flex-1 h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'invite-users') {
    return (
      <Card className="mx-auto w-full max-w-2xl rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <UserPlus className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Invitar responsables</CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            Podés invitar responsables para cada módulo (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {selectedModules.map(moduleId => {
              const module = AVAILABLE_MODULES[moduleId as keyof typeof AVAILABLE_MODULES];
              const Icon = module.icon;
              
              return (
                <div key={moduleId} className="rounded-xl border-2 border-slate-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-lg bg-slate-100 p-2">
                      <Icon className={`size-5 ${module.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{module.name}</h3>
                      <p className="text-sm text-slate-600">Responsable del módulo</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="email@empresa.com (opcional)"
                      value={moduleInvitations[moduleId] || ''}
                      onChange={(e) => setModuleInvitations(prev => ({
                        ...prev,
                        [moduleId]: e.target.value
                      }))}
                      className={inputStrong}
                    />
                    {moduleInvitations[moduleId] && moduleInvitations[moduleId].trim() && 
                     (!moduleInvitations[moduleId].includes('@') || !moduleInvitations[moduleId].includes('.')) && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="size-4 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="size-2 rounded-full bg-red-500"></span>
                        </span>
                        Formato de email inválido
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-6 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('modules')}
              className="flex-1 h-12 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              Volver
            </Button>
            <Button 
              onClick={onFinishSetup}
              disabled={invitingUsers}
              className="flex-1 h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {invitingUsers ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Finalizando...
                </>
              ) : (
                "Finalizar configuración"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}