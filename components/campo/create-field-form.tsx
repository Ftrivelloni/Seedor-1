"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/ui/select";
import { Textarea } from "@/ui/textarea";

type Step = 0 | 1 | 2;

export default function CreateFieldForm() {
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Empresa
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Argentina");

  // Campo
  const [fieldName, setFieldName] = useState("");
  const [areaHas, setAreaHas] = useState("");
  const [mainCrop, setMainCrop] = useState("");
  const [irrigation, setIrrigation] = useState<"secano" | "riego" | "mixto" | "">("");
  const [location, setLocation] = useState("");

  // Módulos
  const [mods, setMods] = useState<string[]>(["campo", "inventario"]);
  const toggleMod = (m: string) =>
    setMods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const canNext = () => {
    if (step === 0) return companyName && contactName && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (step === 1) return fieldName && mainCrop;
    if (step === 2) return mods.length > 0;
    return false;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // FRONT ONLY (demo). Cuando el back esté listo, reemplazá esto por un fetch al endpoint correspondiente.
      await new Promise((r) => setTimeout(r, 900));
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "No se pudo crear el campo");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-xl rounded-2xl border bg-card/90 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10">
            <Check className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">¡Campo creado!</CardTitle>
          <CardDescription>Ya podés invitar a tu equipo y empezar a usar los módulos seleccionados.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center gap-3">
          <Button asChild><a href="/home">Ir al panel</a></Button>
          <Button variant="outline" asChild><a href="/login">Volver al inicio</a></Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-2xl rounded-2xl border bg-card/90 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Crear campo</CardTitle>
        <CardDescription>Completá los pasos para configurar tu cuenta.</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Progreso */}
        <ol className="mb-6 flex items-center gap-2 text-sm">
          {["Empresa", "Campo", "Módulos"].map((label, i) => {
            const ix = i as Step;
            const passed = step > ix;
            const current = step === ix;
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={[
                    "grid size-6 place-items-center rounded-full border text-[11px]",
                    passed ? "bg-primary text-white border-primary" : current ? "border-primary text-primary" : "text-muted-foreground"
                  ].join(" ")}
                >
                  {passed ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={current ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
                {i < 2 && <span className="mx-2 h-px w-8 bg-border" />}
              </li>
            );
          })}
        </ol>

        <form onSubmit={onSubmit} className="space-y-5">
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="company">Nombre de la empresa</Label>
                  <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact">Contacto</Label>
                  <Input id="contact" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nombre@empresa.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccioná tu país" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Argentina", "Uruguay", "Paraguay", "Chile", "Bolivia", "Brasil", "España", "Otro"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="field">Nombre del campo</Label>
                  <Input id="field" value={fieldName} onChange={(e) => setFieldName(e.target.value)} required placeholder="Ej: Estancia Los Ceibos" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="crop">Cultivo principal</Label>
                  <Input id="crop" value={mainCrop} onChange={(e) => setMainCrop(e.target.value)} required placeholder="Nogal, Pistacho, etc." />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="area">Superficie (ha)</Label>
                  <Input id="area" value={areaHas} onChange={(e) => setAreaHas(e.target.value)} placeholder="ej: 120" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="irrigation">Sistema</Label>
                  <Select value={irrigation} onValueChange={(v)=>setIrrigation(v as any)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccioná" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secano">Secano</SelectItem>
                      <SelectItem value="riego">Riego</SelectItem>
                      <SelectItem value="mixto">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="loc">Ubicación (opcional)</Label>
                <Textarea id="loc" value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Provincia, departamento, coordenadas, etc." />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Elegí los módulos que querés activar. Podés cambiarlos luego.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "campo", label: "Campo (tareas y lotes)" },
                  { key: "inventario", label: "Inventario" },
                  { key: "empaque", label: "Empaque y trazabilidad" },
                  { key: "finanzas", label: "Finanzas" },
                ].map((m) => (
                  <label key={m.key} className="flex items-center gap-3 rounded-lg border p-3">
                    <Checkbox checked={mods.includes(m.key)} onCheckedChange={() => toggleMod(m.key)} />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={()=> setStep((s)=> Math.max(0, s-1) as Step)} disabled={step===0 || loading}>
              <ChevronLeft className="mr-2 size-4" /> Volver
            </Button>
            <Button type="submit" disabled={!canNext() || loading}>
              {loading ? (<><Loader2 className="mr-2 size-4 animate-spin" /> Guardando…</>) : step<2 ? (<>Siguiente <ChevronRight className="ml-2 size-4" /></>) : (<>Crear campo</>)}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
