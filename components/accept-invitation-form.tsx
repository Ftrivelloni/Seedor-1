"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Eye, EyeOff, Building2, User, Mail, Phone, IdCard, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { authService, validators } from "../lib/supabaseAuth";

// Estilos consistentes con register-tenant-form
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

export default function AcceptInvitationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Estados para usuario existente
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Estados para nuevo usuario
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError("Token de invitación inválido");
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading invitation with token:', token);
        
        const { success, data, error: inviteError } = await authService.getInvitationByToken(token);
        
        if (!success || !data) {
          console.error('❌ Error loading invitation:', inviteError);
          setError(inviteError || "Invitación no encontrada o expirada");
          setLoading(false);
          return;
        }

        console.log('✅ Invitation loaded:', data);
        setInvitation(data);

        try {
          console.log('🔍 Checking current session...');
          
          const { supabase } = await import('../lib/supabaseClient');
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          console.log('📋 Session data:', {
            hasSession: !!sessionData.session,
            userEmail: sessionData.session?.user?.email,
            invitationEmail: data.email
          });

          if (sessionData.session?.user?.email === data.email) {
            console.log('✅ User already authenticated with correct email');
            setIsExistingUser(true);
          } else if (sessionData.session?.user) {
            console.log('⚠️ User authenticated but with different email');
            setIsExistingUser(false);
          } else {
            console.log('📝 No authenticated user, treating as new user');
            setIsExistingUser(false);
          }

        } catch (sessionError) {
          console.log('⚠️ Session check error, treating as new user:', sessionError);
          setIsExistingUser(false);
        }

      } catch (err: any) {
        console.error('❌ Error in loadInvitation:', err);
        setError(err.message || "Error al cargar invitación");
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'fullName':
        if (!validators.text(value, 2, 100)) {
          return 'Debe tener entre 2 y 100 caracteres'
        }
        break;
      case 'password':
        if (value && !validators.password(value)) {
          return 'Debe tener entre 8 y 128 caracteres'
        }
        break;
      case 'phone':
        if (value && !validators.phone(value)) {
          return 'Formato inválido'
        }
        break;
    }
    return '';
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    switch (fieldName) {
      case 'fullName':
        setFullName(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'phone':
        setPhone(value);
        break;
    }

    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const acceptInvitation = async () => {
    setError(null);
    setAccepting(true);

    try {
      console.log('🔄 Accepting invitation for existing user...');
      
      const { success, error: acceptError, data } = await authService.acceptInvitation({ token });

      if (!success) {
        console.error('❌ Error accepting invitation:', acceptError);
        setError(acceptError || "Error al aceptar invitación");
        return;
      }

      console.log('✅ Invitation accepted successfully');

      if (invitation.role_code === 'admin') {
        console.log('👨‍💼 Redirecting to admin setup...');
        router.push(`/admin-setup?token=${token}`);
      } else {
        console.log('👤 Regular user, showing completion...');
        setDone(true);
        setTimeout(() => router.push("/home"), 2000);
      }

    } catch (err: any) {
      console.error('❌ Error in acceptInvitation:', err);
      setError(err.message || "Error inesperado");
    } finally {
      setAccepting(false);
    }
  };

  const createAccountAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const allErrors: Record<string, string> = {};
    allErrors.fullName = validateField('fullName', fullName);
    allErrors.password = validateField('password', password);
    allErrors.phone = validateField('phone', phone);

    const filteredErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([_, error]) => error !== '')
    );

    setFieldErrors(filteredErrors);

    if (Object.keys(filteredErrors).length > 0) {
      setError("Por favor corregí los errores en el formulario.");
      return;
    }

    if (!fullName || !password) {
      setError("Completá todos los campos obligatorios.");
      return;
    }

    setCreating(true);

    try {
      console.log('🔄 Creating account and accepting invitation...');
      
      const { success, error: acceptError, data } = await authService.acceptInvitation({
        token,
        userData: {
          fullName,
          password,
          phone: phone || undefined
        }
      });

      if (!success) {
        console.error('❌ Error creating account:', acceptError);
        setError(acceptError || "Error al crear cuenta");
        return;
      }

      console.log('✅ Account created and invitation accepted');

      if (invitation.role_code === 'admin') {
        console.log('👨‍💼 Redirecting to admin setup...');
        setTimeout(() => {
          router.push(`/admin-setup?token=${token}`);
        }, 500);
      } else {
        console.log('👤 Regular user, showing completion...');
        setDone(true);
        setTimeout(() => router.push("/home"), 2000);
      }

    } catch (err: any) {
      console.error('❌ Error in createAccountAndAccept:', err);
      setError(err.message || "Error inesperado");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="size-12 animate-spin text-[#81C101] mb-4" />
            <p className="text-slate-600">Cargando invitación...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <Check className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">¡Invitación aceptada!</CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            Ya tenés acceso a <strong className="text-[#81C101]">{invitation?.tenants?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pt-4">
          <p className="text-sm text-slate-500">Redirigiendo al dashboard...</p>
        </CardFooter>
      </Card>
    );
  }

  if (error || !invitation) {
    return (
      <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
            <Shield className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Error</CardTitle>
          <CardDescription className="text-red-600 mt-2">
            {error || "Invitación no válida"}
          </CardDescription>
        </CardHeader>
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

  if (isExistingUser) {
    return (
      <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <Building2 className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Invitación recibida</CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            Te invitaron a unirte a <strong className="text-[#81C101]">{invitation.tenants?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4">
              <div className="flex items-center gap-3">
                <User className="size-5 text-[#81C101]" />
                <div>
                  <p className="font-semibold text-slate-800">Rol asignado</p>
                  <p className="text-sm text-slate-600">{invitation.roles?.name}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-5 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-800">Empresa</p>
                  <p className="text-sm text-slate-600">{invitation.tenants?.name}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => router.push("/home")} 
            className="flex-1 h-12 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
          >
            Cancelar
          </Button>
          <Button 
            onClick={acceptInvitation} 
            disabled={accepting} 
            className="flex-1 h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Aceptando...
              </>
            ) : (
              "Aceptar invitación"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Nuevo usuario - crear cuenta
  return (
    <Card className="mx-auto w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
          <User className="size-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">Crear tu cuenta</CardTitle>
        <CardDescription className="text-slate-600 mt-2">
          Te invitaron a <strong className="text-[#81C101]">{invitation.tenants?.name}</strong> como <strong>{invitation.roles?.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={createAccountAndAccept} className="space-y-6">
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

          <ValidatedInput
            id="password"
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handleFieldChange}
            fieldName="password"
            fieldErrors={fieldErrors}
            placeholder="Mínimo 8 caracteres"
            required
            icon={showPassword ? EyeOff : Eye}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 z-10 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
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
            disabled={creating}
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Creando cuenta...
              </>
            ) : (
              "Crear cuenta y continuar"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center pt-4">
        <p className="text-xs text-slate-500 text-center">
          Al crear la cuenta aceptás la invitación y tendrás acceso a {invitation.tenants?.name}
        </p>
      </CardFooter>
    </Card>
  );
}