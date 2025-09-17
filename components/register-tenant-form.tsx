// components/register-tenant-form.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { MODULES, FEATURES, REQUIRED_IDS } from "../lib/features";

// ====== Precios (editables) ======
const BASE_PRICE = 99;
const BASE_USERS_INCLUDED = 5;
const USER_PRICE = 100;
const FEATURE_PRICE = 50;

const OPTIONAL_KEY = "seedor.features.optional";
const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function RegisterTenantForm() {
  // Empresa
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [mainCrop, setMainCrop] = useState("");

  // Usuarios
  const [users, setUsers] = useState<number>(BASE_USERS_INCLUDED);

  // Funcionalidades: obligatorias + opcionales
  const [optional, setOptional] = useState<string[]>([]);
  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem(OPTIONAL_KEY)
        : null;
    if (raw) {
      try {
        setOptional(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const allSelected = useMemo(() => {
    const set = new Set([...REQUIRED_IDS, ...optional]);
    return FEATURES.filter((f) => set.has(f.id));
  }, [optional]);

  // Precio
  const { extraUsers, subtotalUsers, subtotalFeatures, total } = useMemo(() => {
    const extraUsers = Math.max(0, users - BASE_USERS_INCLUDED);
    const subtotalUsers = extraUsers * USER_PRICE;
    const subtotalFeatures = allSelected.length * FEATURE_PRICE;
    const total = BASE_PRICE + subtotalUsers + subtotalFeatures;
    return { extraUsers, subtotalUsers, subtotalFeatures, total };
  }, [users, allSelected]);

  // Submit demo
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!companyName || !contactName) {
      setError("Completá nombre de empresa y contacto.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setDone(true);
  }

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-xl rounded-2xl border bg-card/90 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10">
            <Check className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">¡Empresa creada!</CardTitle>
          <CardDescription>
            {Math.max(users, BASE_USERS_INCLUDED)} usuarios ·{" "}
            {allSelected.length} funcionalidades.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center gap-3">
          <Button asChild>
            <a href="/home">Ir al panel</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/login">Volver al inicio</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const inputStrong =
    "h-11 bg-white border-muted shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30";

  return (
    <Card className="mx-auto w-full max-w-3xl rounded-2xl border bg-card/90 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Registro de empresa</CardTitle>
        <CardDescription>
          Precio piso <strong>{fmt.format(BASE_PRICE)}/mes</strong>. Incluye{" "}
          <strong>{BASE_USERS_INCLUDED}</strong> usuarios. Los extras valen{" "}
          <strong>{fmt.format(USER_PRICE)}</strong>/mes cada uno. Cada
          funcionalidad suma{" "}
          <strong>{fmt.format(FEATURE_PRICE)}</strong>/mes.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Datos empresa */}
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="company">Nombre de la empresa</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className={inputStrong}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contacto</Label>
                <Input
                  id="contact"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className={inputStrong}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="crop">Cultivo principal</Label>
              <Input
                id="crop"
                value={mainCrop}
                onChange={(e) => setMainCrop(e.target.value)}
                placeholder="Nogal, Pistacho, etc."
                className={inputStrong}
              />
            </div>
          </section>

          {/* Usuarios + funcionalidades */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Usuarios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Usuarios</h3>
              <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                <Label>Cantidad</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={BASE_USERS_INCLUDED}
                    value={users}
                    onChange={(e) =>
                      setUsers(
                        Math.max(
                          Number(e.target.value || BASE_USERS_INCLUDED),
                          BASE_USERS_INCLUDED
                        )
                      )
                    }
                    className={`w-32 ${inputStrong}`}
                  />
                  <span className="text-sm text-muted-foreground">
                    mín. {BASE_USERS_INCLUDED} incluidos
                  </span>
                </div>
                <div className="mt-4 rounded-lg border bg-background p-3 text-sm">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-muted-foreground">
                      Usuarios extra ({extraUsers})
                    </span>
                    <span className="font-medium">
                      {fmt.format(subtotalUsers)}/mes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Incluidos</span>
                    <span className="font-medium">
                      {BASE_USERS_INCLUDED}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Funcionalidades (con fixes de layout) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Funcionalidades</h3>

              {/* <== agregamos overflow-hidden aquí */}
              <div className="rounded-xl border bg-card p-4 shadow-sm overflow-hidden">
                <p className="text-sm text-muted-foreground">
                  Seleccioná las funcionalidades en la pantalla dedicada. Las
                  obligatorias ya vienen incluidas.
                </p>

                <ul className="mt-3 grid list-disc gap-1 pl-5 text-sm text-muted-foreground">
                  {MODULES.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>

                {/* botonera que envuelve y no se sale */}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button asChild className="w-full sm:flex-1">
                    <a href="/funcionalidades">Configurar funcionalidades</a>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto sm:shrink-0"
                    onClick={() => {
                      localStorage.removeItem(OPTIONAL_KEY);
                      setOptional([]);
                    }}
                  >
                    Limpiar selección
                  </Button>
                </div>

                {/* resumen visual */}
                <div className="mt-4 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="size-4 text-primary" />
                      Seleccionadas (incluye obligatorias)
                    </span>

                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      {allSelected.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Resumen de costos */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold">Resumen</h3>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">
                  Plan básico (piso)
                </span>
                <span className="font-medium">
                  {fmt.format(BASE_PRICE)}/mes
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">
                  Usuarios extra ({extraUsers} × {fmt.format(USER_PRICE)})
                </span>
                <span className="font-medium">
                  {fmt.format(subtotalUsers)}/mes
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">
                  Funcionalidades ({allSelected.length} ×{" "}
                  {fmt.format(FEATURE_PRICE)})
                </span>
                <span className="font-medium">
                  {fmt.format(subtotalFeatures)}/mes
                </span>
              </div>
              <div className="my-3 h-px bg-border" />
              <div className="flex items-center justify-between py-2">
                <span className="text-lg font-semibold">Total mensual</span>
                <span className="text-lg font-extrabold">
                  {fmt.format(total)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Precios demo. Ajustables en este archivo.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold">Incluye siempre</h3>
              <ul className="grid list-disc gap-1 pl-5 text-sm text-muted-foreground">
                <li>{BASE_USERS_INCLUDED} usuarios incluidos</li>
                <li>Soporte estándar</li>
                <li>Acceso web + móvil</li>
                <li>Exportación de datos</li>
              </ul>
            </div>
          </section>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button type="submit" disabled={loading} className="h-11">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Creando…
                </>
              ) : (
                "Crear empresa"
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href="/">Volver a la página principal</a>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
