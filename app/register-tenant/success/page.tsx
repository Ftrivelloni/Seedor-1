"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import Header from '../../../components/header';

export default function RegistrationSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Procesando tu pago...');

  useEffect(() => {
    // Wait a bit for the webhook to process
    const timer = setTimeout(() => {
      setStatus('success');
      setMessage('¡Pago confirmado! Revisa tu email para completar la configuración de tu cuenta.');
      
      // Redirect to login after 5 seconds
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-background p-6 pt-25">
        <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
              {status === 'processing' ? (
                <Loader2 className="size-8 animate-spin text-white" />
              ) : status === 'success' ? (
                <Check className="size-8 text-white" />
              ) : (
                <span className="text-white text-2xl">!</span>
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              {status === 'processing' ? 'Procesando pago...' : 
               status === 'success' ? '¡Pago exitoso!' : 
               'Error en el pago'}
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Te hemos enviado un email con un enlace para completar la configuración de tu cuenta como administrador.
                </p>
                <p className="text-sm text-slate-500">
                  Redirigiendo al inicio de sesión en 5 segundos...
                </p>
              </div>
            )}
            {status === 'processing' && (
              <p className="text-sm text-slate-600">
                Estamos verificando tu pago con nuestro proveedor. Esto puede tardar unos segundos.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
