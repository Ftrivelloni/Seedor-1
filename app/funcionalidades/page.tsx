// /app/funcionalidades/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MODULES, FEATURES, REQUIRED_IDS, type Feature } from "../../lib/features";
import { Button } from "../../components/ui/button";

const OPTIONAL_KEY = "seedor.features.optional";

export default function FuncionalidadesPage() {
  const [optional, setOptional] = useState<string[]>([]);

  // Cargar selecciones previas
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(OPTIONAL_KEY) : null;
    if (raw) {
      try {
        setOptional(JSON.parse(raw));
      } catch {}
    }
  }, []);

  function toggle(id: string) {
    setOptional(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function saveAndBack() {
    localStorage.setItem(OPTIONAL_KEY, JSON.stringify(optional));
    window.location.href = "/register-tenant";
  }

  const byModule = useMemo(() => {
    const m: Record<string, Feature[]> = {};
    for (const name of MODULES) m[name] = [];
    for (const f of FEATURES) m[f.module].push(f);
    return m;
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border bg-card p-6 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-primary/90">
          Funcionalidades del sistema
        </h1>
        <p className="text-center text-sm font-medium">
          <span className="text-muted-foreground">¡Conocé las funcionalidades que ofrecemos!</span>
        </p>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Las resaltadas en <span className="font-semibold text-yellow-600">amarillo</span> son
          <span className="font-semibold"> obligatorias</span> y las
          <span className="font-semibold text-green-600"> verdes</span> son opcionales.
        </p>

        <div className="mt-6 space-y-4">
          {MODULES.map((mod) => {
            const items = byModule[mod];
            return (
              <details key={mod} className="group rounded-xl border bg-background p-3 open:bg-card/60">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-2 hover:bg-accent/40">
                  <span className="font-semibold">{mod}</span>
                  <span className="text-sm text-muted-foreground group-open:rotate-90 transition">
                    ▶
                  </span>
                </summary>

                <div className="mt-3 space-y-2">
                  {items.map((f) => {
                    const isRequired = f.required;
                    const isChecked = isRequired || optional.includes(f.id);
                    const tone = isRequired ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200";
                    return (
                      <div
                        key={f.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${tone}`}
                      >
                        {!isRequired ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggle(f.id)}
                            className="mt-0.5 size-4"
                          />
                        ) : (
                          <div className="mt-0.5 size-4 rounded-full bg-yellow-500" />
                        )}
                        <div className="text-sm">
                          <div className="font-medium">{f.title}</div>
                          {!isRequired && (
                            <div className="text-[11px] text-muted-foreground">
                              Opcional · + USD 50/mes
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={saveAndBack} className="h-10">
            Volver al registro
          </Button>
        </div>
      </div>
    </main>
  );
}
