import type { Metadata } from "next";
import CreateFieldForm from "../../components/campo/create-field-form";

export const metadata: Metadata = {
  title: "Crear campo — Seedor",
};

export default function CrearCampoPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-background">
      <section className="mx-auto grid max-w-7xl grid-cols-1 place-items-center px-6 py-16 md:grid-cols-2 md:gap-12 md:py-24">
        <div className="hidden w-full md:block">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Configurá tu <span className="text-primary">campo</span>
          </h1>
          <div className="mt-3 h-1 w-20 rounded bg-primary/40" />
          <p className="mt-4 max-w-lg text-muted-foreground">
            Te guiamos en 3 pasos rápidos para dejar todo listo: datos de empresa, campo y módulos.
          </p>

          <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Incluye</p>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li>✅ Multi-equipo</li>
              <li>✅ Permisos y auditoría</li>
              <li>✅ Exportación de datos</li>
              <li>✅ Web + móvil</li>
            </ul>
          </div>
        </div>

        <div className="w-full">
          <CreateFieldForm />
        </div>
      </section>
    </main>
  );
}
