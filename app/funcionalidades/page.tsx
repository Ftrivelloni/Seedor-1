// /app/funcionalidades/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MODULES, FEATURES, type Feature } from "../../lib/features";
import { Button } from "../../components/ui/button";

// Clave de storage (misma que usa el registro)
const OPTIONAL_KEY = "seedor.features.optional";

// Precio por funcionalidad opcional (si no viene por feature/DB)
const FEATURE_PRICE = 50;

// Helper de formato: "1,234usd"
const fmtNum = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const money = (n: number) => `${fmtNum.format(n)}usd`;

export default function FuncionalidadesPage() {
    const [optional, setOptional] = useState<string[]>([]);

    // Cargar selecciones previas
    useEffect(() => {
        const raw =
            typeof window !== "undefined" ? localStorage.getItem(OPTIONAL_KEY) : null;
        if (raw) {
            try {
                setOptional(JSON.parse(raw));
            } catch {
                /* noop */
            }
        }
    }, []);

    // Guardar y volver
    function saveAndBack() {
        localStorage.setItem(OPTIONAL_KEY, JSON.stringify(optional));
        window.location.href = "/register-tenant";
    }

    // Toggle de opcional (las obligatorias NO se tocan)
    function toggle(id: string, required: boolean) {
        if (required) return;
        setOptional((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    // Agrupar por módulo (todo visible en columnas verticales)
    const byModule = useMemo(() => {
        const m: Record<string, Feature[]> = {};
        for (const name of MODULES) m[name] = [];
        for (const f of FEATURES) m[f.module].push(f);
        return m;
    }, []);

    // Métricas (para miniresumen)
    const selectedOptionalCount = optional.length;
    const optionalMonthly = selectedOptionalCount * FEATURE_PRICE;

    return (
        <main className="mx-auto max-w-4xl px-4 py-10">
            <div className="rounded-2xl border bg-card/90 p-6 shadow-lg">
                <header className="mb-6 text-center">
                    <h1 className="text-2xl font-extrabold text-primary/90">
                        Elegí las funcionalidades
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Las <span className="font-semibold">obligatorias</span> vienen
                        incluidas. Activá las opcionales que necesites.
                    </p>

                    <div className="mx-auto mt-4 inline-flex items-center gap-3 rounded-xl border bg-background px-4 py-2 text-sm">
            <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              Obligatoria
            </span>
                        <span className="text-muted-foreground">•</span>
                        <span>
              Opcionales: <strong>{selectedOptionalCount}</strong> (
              <strong>{money(optionalMonthly)}/mes</strong>)
            </span>
                    </div>
                </header>

                {/* Secciones por módulo, verticales */}
                <div className="space-y-8">
                    {MODULES.map((mod) => {
                        const items = byModule[mod] || [];
                        if (!items.length) return null;

                        return (
                            <section key={mod} className="rounded-xl border bg-background">
                                <h2 className="border-b px-4 py-3 text-lg font-semibold">
                                    {mod}
                                </h2>

                                <ul className="divide-y">
                                    {items.map((f) => {
                                        const isRequired = !!f.required;
                                        const isActive = isRequired || optional.includes(f.id);
                                        const fullText =
                                            (f as any).description?.trim?.() || f.title;

                                        // Switch consistente
                                        const switchBase =
                                            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
                                        const switchBg = isActive ? "bg-emerald-500" : "bg-muted";
                                        const switchInteractivity = isRequired
                                            ? "pointer-events-none opacity-60"
                                            : "";

                                        return (
                                            <li
                                                key={f.id}
                                                className={`flex items-start justify-between gap-3 px-4 py-3 ${
                                                    isRequired ? "bg-yellow-50/40" : "bg-white"
                                                }`}
                                            >
                                                {/* Texto siempre visible, en vertical */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                            <span className="font-medium break-words">
                              {f.title}
                            </span>
                                                        {isRequired && (
                                                            <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-800">
                                Obligatoria
                              </span>
                                                        )}
                                                    </div>

                                                    {/* Descripción completa (si existe) */}
                                                    {fullText && fullText !== f.title && (
                                                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground break-words">
                                                            {fullText}
                                                        </p>
                                                    )}

                                                    {/* Meta / precio */}
                                                    {!isRequired ? (
                                                        <div className="mt-1 text-[11px] text-muted-foreground">
                                                            Opcional · + {money(FEATURE_PRICE)}/mes
                                                        </div>
                                                    ) : (
                                                        <div className="mt-1 text-[11px] text-muted-foreground">
                                                            Incluida en el paquete base
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Píldora a la derecha */}
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={isActive}
                                                    aria-disabled={isRequired}
                                                    aria-label={
                                                        isRequired
                                                            ? "Funcionalidad obligatoria"
                                                            : isActive
                                                                ? "Desactivar funcionalidad"
                                                                : "Activar funcionalidad"
                                                    }
                                                    onClick={() => toggle(f.id, isRequired)}
                                                    className={`${switchBase} ${switchBg} ${switchInteractivity} mt-1`}
                                                >
                          <span
                              className={[
                                  "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                                  isActive ? "translate-x-5" : "translate-x-0",
                              ].join(" ")}
                          />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        );
                    })}
                </div>

                {/* Footer acciones */}
                <div className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <div className="text-sm text-muted-foreground">
                        Seleccionaste <strong>{selectedOptionalCount}</strong> opcionales ·{" "}
                        <strong>{money(optionalMonthly)}/mes</strong> adicionales
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOptional([])}
                        >
                            Limpiar selección
                        </Button>
                        <Button type="button" onClick={saveAndBack}>
                            Volver al registro
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
