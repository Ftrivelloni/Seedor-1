"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

import { Button } from "./ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // chips de demo
  const demoUsers = [
    { label: "Admin", email: "admin@latoma.com" },
    { label: "Campo", email: "campo@latoma.com" },
    { label: "Empaque", email: "empaque@latoma.com" },
    { label: "Finanzas", email: "finanzas@latoma.com" },
  ];
  function quickFill(u: string) {
    setEmail(u);
    setPassword("demo123");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresá un email válido");
      return;
    }
    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data?.message as string) || "No se pudo iniciar sesión");
      }

        const next = params.get("next") || "/home";

    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md rounded-2xl border bg-card/90 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>Accedé con tu email y contraseña</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" aria-describedby={error ? "login-error" : undefined}>
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
                className="h-11 pl-10 focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              Recordarme
            </label>
            <a href="/forgot-password" className="text-sm text-primary hover:underline">
  ¿Olvidaste tu contraseña?
</a>

          </div>

          {error && (
            <div id="login-error" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Ingresar
          </Button>

          {/* Chips de demo */}
          <div className="pt-3">
            <p className="mb-2 text-xs text-muted-foreground">Usuarios de prueba rápidos:</p>
            <div className="flex flex-wrap gap-2">
              {demoUsers.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => quickFill(d.email)}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <a className="ml-1 text-primary hover:underline" href="/register-tenant">
          Creá tu cuenta
        </a>
      </CardFooter>
    </Card>
  );
}
