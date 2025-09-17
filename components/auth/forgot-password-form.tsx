"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!sent || cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [sent, cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresá un email válido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.message || "No se pudo enviar el email");
      }
      setSent(true);
      setCooldown(20);
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="mx-auto w-full rounded-2xl border bg-card/90 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Revisá tu correo</CardTitle>
          <CardDescription>Si existe una cuenta asociada, te enviamos un enlace para restablecer la contraseña.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Si no ves el mensaje en unos minutos, revisá spam o intentá reenviarlo.</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => router.push("/login")} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 size-4" /> Volver al login
          </Button>
          <Button onClick={() => onSubmit(new Event("submit") as any)} disabled={cooldown > 0} className="w-full sm:w-auto">
            {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar email"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md rounded-2xl border bg-card/90 shadow-lg">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-2xl">¿Olvidaste tu contraseña?</CardTitle>
        <CardDescription>Te enviamos un enlace para restablecerla</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" aria-describedby={error ? "forgot-error" : undefined}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="nombre@seedor.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11 pl-10"
              />
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {error && (
            <div id="forgot-error" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Enviar enlace
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        ¿Ya la recordaste?{" "}
        <a className="ml-1 text-primary hover:underline" href="/login">
          Volver a iniciar sesión
        </a>
      </CardFooter>
    </Card>
  );
}
