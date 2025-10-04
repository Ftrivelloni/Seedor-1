"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CampoHome() {
  // Maqueta (reemplazá por datos reales)
  const items = [
    { id: "P-1", nombre: "Parcela 1", estado: "Activa" },
    { id: "P-2", nombre: "Parcela 2", estado: "En descanso" },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Campo</h1>
        <Button asChild>
          <Link href="/campo/nuevo">Nueva parcela</Link>
        </Button>
      </div>

      <div className="grid gap-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-2xl border p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{it.nombre}</p>
                <p className="text-sm text-muted-foreground">Estado: {it.estado}</p>
              </div>
              <Button variant="secondary" asChild>
                <Link href="#">Abrir</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
