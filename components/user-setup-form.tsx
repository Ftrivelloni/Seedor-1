"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Check, Loader2, Eye, EyeOff, User, Mail, Phone, IdCard, Shield,
  MapPin, Package, DollarSign
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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

const ROLE_CONFIGS = {
  admin: {
    icon: Shield,
    color: 'text-[#81C101]',
    title: 'Completá tu perfil de administrador',
    description: 'Configurá tu acceso como administrador',
    successTitle: '¡Configuración de administrador completa!',
    features: 'Tendrás acceso completo para gestionar la empresa y configurar módulos.'
  },
  campo: {
    icon: MapPin,
    color: 'text-green-600',
    title: 'Completá tu perfil de campo',
    description: 'Configurá tu acceso al módulo de campo',
    successTitle: '¡Acceso al módulo de campo configurado!',
    features: 'Podrás gestionar tareas de campo, cultivos y lotes.'
  },
  empaque: {
    icon: Package,
    color: 'text-blue-600',
    title: 'Completá tu perfil de empaque',
    description: 'Configurá tu acceso al módulo de empaque',
    successTitle: '¡Acceso al módulo de empaque configurado!',
    features: 'Tendrás acceso al procesamiento y empaque de productos.'
  },
  finanzas: {
    icon: DollarSign,
    color: 'text-purple-600',
    title: 'Completá tu perfil de finanzas',
    description: 'Configurá tu acceso al módulo de finanzas',
    successTitle: '¡Acceso al módulo de finanzas configurado!',
    features: 'Podrás gestionar la caja chica y movimientos financieros.'
  }
};

interface UserSetupFormProps {
  userType?: 'admin' | 'module-user';
  onComplete?: (data: any) => void;
}

export default function UserSetupForm({ userType = 'module-user', onComplete }: UserSetupFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [currentStep, setCurrentStep] = useState<'user-info' | 'complete'>('user-info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invitation, setInvitation] = useState<any>(null);
  const [roleConfig, setRoleConfig] = useState(ROLE_CONFIGS.campo);

  const [documentId, setDocumentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState("Guardando...");

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

        const roleKey = data.role_code as keyof typeof ROLE_CONFIGS;
        setRoleConfig(ROLE_CONFIGS[roleKey] || ROLE_CONFIGS.campo);

        if (typeof window !== 'undefined') {
          const savedData = sessionStorage.getItem(`${roleKey}_signup_data`);
          if (savedData) {
            try {
              const signupData = JSON.parse(savedData);
              
              const savedAt = new Date(signupData.timestamp || 0);
              const now = new Date();
              const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
              
              if (hoursDiff <= 1 && signupData.token === token) {
                console.log('📂 Restoring signup data...');
                setFullName(signupData.fullName || '');
                setPassword(signupData.password || '');
                setPhone(signupData.phone || '');
                setDocumentId(signupData.documentId || '');
              } else {
                sessionStorage.removeItem(`${roleKey}_signup_data`);
              }
            } catch (e) {
              sessionStorage.removeItem(`${roleKey}_signup_data`);
            }
          }
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

  const onSubmitUserInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
        if (userType === 'admin') {
        console.log('🔄 Preparing admin data...');
        
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('admin_auth_data', JSON.stringify({
            fullName,
            password,
            phone,
            documentId,
            token
            }));
        }

        if (onComplete) {
            console.log('✅ Admin data prepared, calling onComplete');
            onComplete({
                fullName,
                phone,
                documentId,
                password
            });
            return;
        } else {
            setCurrentStep('complete');
        }
        } else {
        console.log('🔄 Setting up module user profile (without creating worker)...');
        setSavingMessage("Creando tu cuenta...");

        const { success, error: acceptError } = await authService.acceptInvitationWithSetup({
            token,
            userData: {
            fullName,
            password, 
            phone: phone || undefined
            }
        });

        if (!success) {
            if (acceptError?.includes('espera unos segundos')) {
                setSavingMessage("Procesando, por favor espera...");
                // Intentar de nuevo después de mostrar el mensaje
                setTimeout(() => {
                    setError(acceptError || "Error al aceptar invitación");
                    setSaving(false);
                }, 2000);
                return;
            }
            setError(acceptError || "Error al aceptar invitación");
            return;
        }

        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(`${invitation.role_code}_signup_data`);
        }

        // Cerrar sesión para evitar inconsistencias
        console.log('🔄 Logging out user to avoid session conflicts...');
        await authService.logout();

        setCurrentStep('complete');
        }

    } catch (err: any) {
        setError(err.message || "Error al guardar datos");
    } finally {
        setSaving(false);
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
      </Card>
    );
  }

  if (currentStep === 'complete') {
    const Icon = roleConfig.icon;
    
    return (
      <Card className="mx-auto w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <Check className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">{roleConfig.successTitle}</CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            Ahora podés iniciar sesión en <strong className="text-[#81C101]">{invitation?.tenants?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4">
            <div className="flex items-center gap-3 mb-2 justify-center">
              <Icon className={`size-6 ${roleConfig.color}`} />
              <h4 className="font-semibold text-slate-800">Tu rol: {invitation?.roles?.name}</h4>
            </div>
            <p className="text-sm text-slate-600">
              {roleConfig.features}
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center pt-4">
          <Button 
            onClick={() => router.push("/login")}
            className="w-full bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Ir al inicio de sesión
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const Icon = roleConfig.icon;

  return (
    <Card className="mx-auto w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
          <Icon className="size-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">{roleConfig.title}</CardTitle>
        <CardDescription className="text-slate-600 mt-2">
          {roleConfig.description} en <strong className="text-[#81C101]">{invitation?.tenants?.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmitUserInfo} className="space-y-6">
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

          <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`size-5 ${roleConfig.color}`} />
              <h4 className="font-semibold text-slate-800">Tu rol: {invitation?.roles?.name}</h4>
            </div>
            <p className="text-sm text-slate-600">
              {roleConfig.features}
            </p>
          </div>

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
              userType === 'admin' ? "Continuar configuración" : "Crear cuenta y continuar"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}