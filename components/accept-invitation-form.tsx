"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Building2, User, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { authService } from "../lib/supabaseAuth";

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

  const acceptInvitation = async () => {
    setError(null);
    setAccepting(true);

    try {
      console.log('🔄 Accepting invitation for existing user...');
      
      if (invitation.role_code === 'admin') {
        console.log('👨‍💼 Admin invitation, redirecting to setup...');
        router.push(`/admin-setup?token=${token}`);
        return;
      }

      // ✅ CAMBIO: Para usuarios de módulos, redirigir a user-setup
      if (['campo', 'empaque', 'finanzas'].includes(invitation.role_code)) {
        console.log('👤 Module user invitation, redirecting to user setup...');
        router.push(`/user-setup?token=${token}`);
        return;
      }

      // Para otros roles, aceptar directamente
      const { success, error: acceptError, data } = await authService.acceptInvitation({ token });

      if (!success) {
        console.error('❌ Error accepting invitation:', acceptError);
        setError(acceptError || "Error al aceptar invitación");
        return;
      }

      console.log('✅ Invitation accepted successfully');
      setDone(true);
      setTimeout(() => router.push("/home"), 2000);

    } catch (err: any) {
      console.error('❌ Error in acceptInvitation:', err);
      setError(err.message || "Error inesperado");
    } finally {
      setAccepting(false);
    }
  };

  // ✅ CAMBIO: Para nuevos usuarios, redirigir según el rol
  const redirectToSetup = () => {
    if (invitation.role_code === 'admin') {
      router.push(`/admin-setup?token=${token}`);
    } else if (['campo', 'empaque', 'finanzas'].includes(invitation.role_code)) {
      router.push(`/user-setup?token=${token}`);
    } else {
      // Para otros roles, mantener lógica anterior si existiera
      setError("Tipo de invitación no soportado");
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

  // ✅ CAMBIO: Nuevo usuario - redirigir a setup según el rol
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
      <CardContent className="space-y-6">
        {/* Información del rol */}
        <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4">
          <div className="flex items-center gap-3 mb-2">
            <User className="size-5 text-[#81C101]" />
            <h4 className="font-semibold text-slate-800">Tu rol: {invitation.roles?.name}</h4>
          </div>
          <p className="text-sm text-slate-600">
            Necesitás completar algunos datos adicionales para configurar tu acceso.
          </p>
        </div>
      </CardContent>
      <CardFooter className="gap-3 pt-4">
        <Button 
          variant="outline" 
          onClick={() => router.push("/login")} 
          className="flex-1 h-12 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
        >
          Cancelar
        </Button>
        <Button 
          onClick={redirectToSetup}
          className="flex-1 h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Completar datos
        </Button>
      </CardFooter>
    </Card>
  );
}