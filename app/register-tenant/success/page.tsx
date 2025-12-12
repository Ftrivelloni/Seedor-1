"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Mail, Loader2, AlertCircle, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProcessingStatus = 'loading' | 'processing' | 'success' | 'error' | 'already_processed';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ProcessingStatus>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  useEffect(() => {
    const processCheckout = async () => {
      // Get email from URL params (LemonSqueezy might pass it) or from localStorage
      let userEmail = searchParams.get("email");

      // Try to get from localStorage if not in URL
      if (!userEmail) {
        const storedEmail = localStorage.getItem('seedor_checkout_email');
        if (storedEmail) {
          userEmail = storedEmail;
        }
      }

      if (!userEmail) {
        // No email - show generic success message
        setStatus('success');
        return;
      }

      setEmail(userEmail);
      setStatus('processing');

      try {
        const response = await fetch('/api/payments/lemon/process-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });

        const data = await response.json();

        if (data.success) {
          setTenantName(data.tenantName);
          setStatus(data.alreadyProcessed ? 'already_processed' : 'success');
          // Clear stored email
          localStorage.removeItem('seedor_checkout_email');
        } else {
          setErrorMessage(data.error || 'Error procesando el pago');
          setStatus('error');
        }
      } catch (error: any) {
        console.error('Error processing checkout:', error);
        setErrorMessage(error.message || 'Error de conexión');
        setStatus('error');
      }
    };

    // Wait a moment for any LemonSqueezy redirects to settle
    const timer = setTimeout(processCheckout, 1000);
    return () => clearTimeout(timer);
  }, [searchParams]);

  if (status === 'loading' || status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="size-12 mx-auto mb-4 text-[#81C101] animate-spin" />
            <p className="text-slate-600">
              {status === 'loading' ? 'Cargando...' : 'Procesando tu pago y creando tu cuenta...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <XCircle className="size-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              Hubo un problema
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">
              {errorMessage || 'No pudimos procesar tu pago'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-semibold mb-1">No te preocupes</p>
                  <p>
                    Si tu pago fue procesado correctamente, tu cuenta se creará
                    automáticamente en unos minutos. Revisá tu email.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => window.location.href = '/register-tenant'}
                className="w-full h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Volver a intentar
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
              >
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <Check className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            ¡Pago exitoso!
          </CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            {tenantName
              ? `Tu empresa "${tenantName}" fue creada correctamente`
              : 'Tu pago se procesó correctamente'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success message */}
          <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4">
            <div className="flex items-start gap-3">
              <Mail className="size-5 text-[#81C101] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#81C101] mb-1">
                  Revisá tu correo electrónico
                </h3>
                <p className="text-sm text-slate-700">
                  Te enviamos un correo {email && (
                    <>a <strong>{email}</strong></>
                  )} con instrucciones para completar la configuración de tu cuenta.
                </p>
              </div>
            </div>
          </div>

          {/* What's next */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800">Próximos pasos:</h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 size-6 rounded-full bg-[#81C101] text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Revisá tu bandeja de entrada (y spam por las dudas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 size-6 rounded-full bg-[#81C101] text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Hacé clic en el enlace de invitación que te enviamos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 size-6 rounded-full bg-[#81C101] text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>Configurá tu contraseña</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 size-6 rounded-full bg-[#81C101] text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>¡Empezá a gestionar tu campo!</span>
              </li>
            </ol>
          </div>

          {/* Info note */}
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Importante</p>
                <p>
                  El enlace de configuración expira en 7 días. Si no lo recibís
                  en los próximos minutos, contactanos a soporte@seedor.com
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Ir al inicio de sesión
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
