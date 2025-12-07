"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Mail, Loader2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get email from URL params if provided
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }

    // Simulate checking for tenant creation (in production, this would be real)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="size-12 mx-auto mb-4 text-[#81C101] animate-spin" />
            <p className="text-slate-600">Procesando tu pago...</p>
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
            Tu pago se procesó correctamente
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
                <span>Completá la configuración de tu cuenta de administrador</span>
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
