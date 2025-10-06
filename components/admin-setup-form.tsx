"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Check, Loader2, Eye, EyeOff, Building2, User, Mail, Phone, IdCard, Shield,
  Settings, MapPin, Package, DollarSign, UserPlus, CheckCircle
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { authService, validators } from "../lib/supabaseAuth";

const inputStrong = "h-12 bg-white border-2 border-slate-200 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#81C101]/30 focus-visible:border-[#81C101] transition-all duration-200";

const ValidatedInput = ({ 
    id, 
    label, 
    value, 
    onChange, 
    fieldName, 
    required = false, 
    type = "text",
    placeholder,
    fieldErrors,
    icon: Icon,
    ...props 
}: any) => (
    <div className="grid gap-3">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="relative">
            {Icon && (
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            )}
            <Input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(fieldName, e.target.value)}
                required={required}
                className={`${inputStrong} ${Icon ? 'pl-12' : 'pl-4'} ${fieldErrors[fieldName] ? 'border-red-400 focus-visible:ring-red-400/30 focus-visible:border-red-400' : ''}`}
                placeholder={placeholder}
                {...props}
            />
        </div>
        <div className="h-5">
            {fieldErrors[fieldName] && (
                <p className="text-sm text-red-500 leading-tight flex items-center gap-1">
                    <span className="size-4 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="size-2 rounded-full bg-red-500"></span>
                    </span>
                    {fieldErrors[fieldName]}
                </p>
            )}
        </div>
    </div>
);

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

  // Estados existentes...
  const [currentStep, setCurrentStep] = useState<'worker-info' | 'modules' | 'invite-users' | 'complete'>('worker-info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invitation, setInvitation] = useState<any>(null);
  const [tenantPlan, setTenantPlan] = useState<string>('');
  const [availableModules, setAvailableModules] = useState<string[]>([]);

  const [documentId, setDocumentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(""); 
  const [showPassword, setShowPassword] = useState(false); 
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [moduleInvitations, setModuleInvitations] = useState<Record<string, string>>({});
  const [invitingUsers, setInvitingUsers] = useState(false);

  const [saving, setSaving] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) {
        setError("Token inválido");
        setLoading(false);
        return;
      }

      try {
        const { success, data, error: inviteError } = await authService.getInvitationByToken(token);
        
        if (!success || !data) {
          setError(inviteError || "Invitación no encontrada");
          setLoading(false);
          return;
        }

        setInvitation(data);

        // ✅ NUEVO: Cargar datos guardados del signup si existen
        if (typeof window !== 'undefined') {
          const savedSignupData = sessionStorage.getItem('admin_signup_data');
          if (savedSignupData) {
            try {
              const signupData = JSON.parse(savedSignupData);
              
              // Verificar que no sean muy antiguos (más de 1 hora)
              const savedAt = new Date(signupData.timestamp || 0);
              const now = new Date();
              const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
              
              if (hoursDiff <= 1 && signupData.token === token) {
                console.log('📂 Restoring signup data...');
                setFullName(signupData.fullName || '');
                setPassword(signupData.password || '');
                setPhone(signupData.phone || '');
              } else {
                console.log('🕐 Signup data is too old or invalid, clearing...');
                sessionStorage.removeItem('admin_signup_data');
              }
            } catch (e) {
              console.warn('Error parsing signup data:', e);
              sessionStorage.removeItem('admin_signup_data');
            }
          }
        }

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

  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'documentId':
        if (!validators.text(value, 6, 20)) {
          return 'Debe tener entre 6 y 20 caracteres'
        }
        break;
      case 'fullName':
        if (!validators.text(value, 2, 100)) {
          return 'Debe tener entre 2 y 100 caracteres'
        }
        break;
      case 'phone':
        if (value && !validators.phone(value)) {
          return 'Formato inválido'
        }
        break;
      case 'password':
        if (!validators.password(value)) {
          return 'Debe tener al menos 8 caracteres'
        }
        break;
    }
    return '';
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    switch (fieldName) {
      case 'documentId':
        setDocumentId(value);
        break;
      case 'fullName':
        setFullName(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'password':
        setPassword(value);
        break;
    }

    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const onSubmitWorkerInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones existentes...
    const allErrors: Record<string, string> = {};
    allErrors.documentId = validateField('documentId', documentId);
    allErrors.fullName = validateField('fullName', fullName);
    allErrors.phone = validateField('phone', phone);
    allErrors.password = validateField('password', password);

    const filteredErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([_, error]) => error !== '')
    );

    setFieldErrors(filteredErrors);

    if (Object.keys(filteredErrors).length > 0) {
      setError("Por favor corregí los errores en el formulario.");
      return;
    }

    if (!documentId || !fullName || !password) {
      setError("Completá todos los campos obligatorios.");
      return;
    }

    setSaving(true);

    try {
      // ✅ CAMBIO: Para admin setup, NO crear usuario aquí, solo crear worker sin password
      console.log('🔄 Creating admin worker profile (no auth user creation)...');
      
      const response = await fetch('/api/admin/create-worker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: invitation.tenant_id,
          email: invitation.email,
          fullName,
          documentId,
          phone,
          // ✅ IMPORTANTE: NO enviar password para evitar creación de usuario
          password: null, 
          areaModule: 'administracion',
          membershipId: null 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear worker');
      }

      const workerData = await response.json();
      setAdminData(workerData.data);

      // Guardar password temporalmente para usar después
      if (typeof window !== 'undefined') {
        const signupData = sessionStorage.getItem('admin_signup_data');
        if (signupData) {
          const data = JSON.parse(signupData);
          sessionStorage.setItem('admin_auth_data', JSON.stringify({
            ...data,
            workerId: workerData.data.id
          }));
          sessionStorage.removeItem('admin_signup_data');
        }
      }

      setCurrentStep('modules');

    } catch (err: any) {
      setError(err.message || "Error al guardar datos");
    } finally {
      setSaving(false);
    }
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
      // Enviar invitaciones a usuarios de módulos (existente)
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

      // Habilitar módulos (existente)
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

      // ✅ NUEVO: Ahora finalizar aceptando la invitación de admin con la sesión activa
      if (typeof window !== 'undefined') {
        const authData = sessionStorage.getItem('admin_auth_data');
        if (authData) {
          const data = JSON.parse(authData);

          console.log('🔄 Accepting admin invitation with active session...');

          const { success, error: acceptError } = await authService.acceptAdminInvitation({
            token,
            workerData: {
              fullName: data.fullName,
              phone: data.phone,
              workerId: data.workerId
            }
          });

          if (!success) {
            setError(acceptError || "Error al finalizar la configuración de administrador");
            return;
          }

          // Limpiar datos temporales
          sessionStorage.removeItem('admin_auth_data');
          console.log('✅ Admin invitation accepted and membership created');
        }
      }

      console.log('✅ Admin setup completed successfully');
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
            Ya podés acceder al dashboard de <strong className="text-[#81C101]">{invitation?.tenants?.name}</strong>
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
            onClick={() => router.push("/home")}
            className="bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Ir al dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (currentStep === 'worker-info') {
    return (
      <Card className="mx-auto w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <User className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Completá tu perfil</CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            Ingresá tus datos como administrador de <strong className="text-[#81C101]">{invitation?.tenants?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitWorkerInfo} className="space-y-6">
            <div className="grid gap-3">
              <Label className="text-sm font-semibold text-slate-700">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <Input
                  type="email"
                  value={invitation?.email || ''}
                  disabled
                  className={`${inputStrong} pl-12 bg-slate-50 text-slate-600 cursor-not-allowed`}
                />
              </div>
              <div className="h-5">
                <p className="text-xs text-slate-500">
                  Este es el email al que se envió la invitación
                </p>
              </div>
            </div>

            <ValidatedInput
              id="documentId"
              label="Documento de identidad"
              value={documentId}
              onChange={handleFieldChange}
              fieldName="documentId"
              fieldErrors={fieldErrors}
              placeholder="12345678"
              required
              icon={IdCard}
            />

            <ValidatedInput
              id="fullName"
              label="Nombre completo"
              value={fullName}
              onChange={handleFieldChange}
              fieldName="fullName"
              fieldErrors={fieldErrors}
              placeholder="Tu nombre y apellido"
              required
              icon={User}
            />

            {/* ✅ NUEVO: Campo de contraseña */}
            <div className="grid gap-3">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  required
                  className={`${inputStrong} pl-12 pr-12 ${fieldErrors.password ? 'border-red-400 focus-visible:ring-red-400/30 focus-visible:border-red-400' : ''}`}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              <div className="h-5">
                {fieldErrors.password ? (
                  <p className="text-sm text-red-500 leading-tight flex items-center gap-1">
                    <span className="size-4 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="size-2 rounded-full bg-red-500"></span>
                    </span>
                    {fieldErrors.password}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Debe tener al menos 8 caracteres
                  </p>
                )}
              </div>
            </div>

            <ValidatedInput
              id="phone"
              label="Teléfono"
              value={phone}
              onChange={handleFieldChange}
              fieldName="phone"
              fieldErrors={fieldErrors}
              placeholder="+54 9 261 123-4567"
              icon={Phone}
            />

            {error && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
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