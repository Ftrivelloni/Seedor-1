"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) return setError("Enlace inválido o vencido.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.message || "No se pudo restablecer la contraseña");
      }
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-md rounded-2xl border bg-card/90 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Contraseña actualizada</CardTitle>
          <CardDescription>Ya podés ingresar con tu nueva contraseña.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => router.replace("/login")}>Ir al login</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md rounded-2xl border bg-card/90 shadow-lg">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
        <CardDescription>Definí una nueva contraseña segura</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" aria-describedby={error ? "reset-error" : undefined}>
          <div className="grid gap-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={show1 ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pl-10 pr-10"
              />
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                onClick={() => setShow1((s) => !s)}
                aria-label={show1 ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show1 ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={show2 ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="h-11 pl-10 pr-10"
              />
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                onClick={() => setShow2((s) => !s)}
                aria-label={show2 ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show2 ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div id="reset-error" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => history.back()} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 size-4" /> Volver
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Guardar contraseña
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
