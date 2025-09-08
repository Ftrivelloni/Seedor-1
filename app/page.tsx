import Link from "next/link"
import Image from "next/image"
import { Button } from "../components/ui/button"
import { ArrowRight, Leaf, Warehouse, LineChart, ChevronDown } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Welcome Intro */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        {/* Colorful accent blobs for welcome section only */}
        <div className="pointer-events-none absolute inset-0 z-0">
              <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-tr from-secondary to-primary opacity-60 blur-3xl" />
              <div className="absolute left-[20%] top-40 h-56 w-56 -translate-x-1/2 rounded-full bg-secondary/90 opacity-50 blur-3xl" />
              <div className="absolute right-[18%] top-56 h-56 w-56 translate-x-1/2 rounded-full bg-primary/90 opacity-50 blur-3xl" />
              {/* Nuevos blobs */}
              <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-accent/70 opacity-40 blur-3xl" />
              <div className="absolute right-10 top-1/3 h-52 w-52 rounded-full bg-muted/80 opacity-40 blur-3xl" />
              <div className="absolute left-1/4 bottom-10 h-64 w-64 rounded-full bg-destructive/60 opacity-40 blur-3xl" />
              {/* Más blobs con los mismos colores */}
              <div className="absolute right-1/4 top-10 h-44 w-44 rounded-full bg-primary/80 opacity-40 blur-3xl" />
              <div className="absolute left-1/3 bottom-1/4 h-48 w-48 rounded-full bg-secondary/80 opacity-40 blur-3xl" />
              <div className="absolute right-1/3 bottom-1/4 h-40 w-40 rounded-full bg-accent/60 opacity-40 blur-3xl" />
              <div className="absolute left-1/5 top-1/2 h-36 w-36 rounded-full bg-muted/70 opacity-40 blur-3xl" />
              <div className="absolute right-1/5 bottom-1/2 h-36 w-36 rounded-full bg-destructive/50 opacity-40 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <div className="relative mx-auto mb-8 h-24 w-48 animate-slide-in-up sm:mb-10 sm:h-32 w-64 sm:h-36 sm:w-72 md:h-40 md:w-80">
            <Image
              src="/seedor-logo.png"
              alt="Seedor"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl animate-slide-in-up-slow">
            ¡Bienvenido a Seedor!
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg animate-slide-in-up">
            Simplificá la gestión agropecuaria con una plataforma pensada para vos.
          </p>
          <div className="mt-12 flex justify-center animate-slide-in-up">
            <a href="#hero" className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              Comenzar
              <ChevronDown className="size-4" />
            </a>
          </div>
        </div>
      </section>
      {/* Hero */}
      <section id="hero" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-6xl px-6 pt-32 pb-0 md:pt-20 md:pb-0">
          <div className="grid items-center gap-8 md:gap-10 md:grid-cols-1">
            <div>
              <h1 className="mt-0 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-slide-in-up">
                Gestioná tu campo de manera simple.
              </h1>
              <p className="mt-8 text-base text-muted-foreground sm:text-lg max-w-2xl animate-slide-in-up">
                Centralizá tareas, inventario, empaque y finanzas en una sola plataforma diseñada para operaciones agropecuarias modernas.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 animate-slide-in-up">
                <Link href="/login">
                  <Button size="lg" variant="outline">Iniciar sesión</Button>
                </Link>
                <Link href="/register-tenant">
                  <Button size="lg" className="gap-2">
                    Crear mi campo
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-10 md:pt-14 md:pb-12">
        <div className="grid gap-8 md:gap-10 md:grid-cols-3 stagger">
          <FeatureCard
            icon={<Leaf className="size-6 text-secondary" />}
            title="Tareas de campo"
            description="Planificá, asigná y hacé seguimiento del trabajo diario en tiempo real."
            className="animate-slide-in-up"
          />
          <FeatureCard
            icon={<Warehouse className="size-6 text-secondary" />}
            title="Inventario y empaque"
            description="Controlá insumos, cosecha y empaque con visibilidad total."
            className="animate-slide-in-up"
          />
          <FeatureCard
            icon={<LineChart className="size-6 text-secondary" />}
            title="Finanzas claras"
            description="Costos, egresos e ingresos siempre a mano para decidir mejor."
            className="animate-slide-in-up"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:pb-32 pt-6 md:pt-6">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-secondary to-primary p-8 md:p-12 text-primary-foreground animate-slide-in-up">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold md:text-3xl">Empezá gratis y escalá a tu ritmo.</h2>
            <p className="mt-3 text-sm/6 opacity-90 md:text-base/7">
              Creá tu tenant en menos de 2 minutos. Sumá a tu equipo cuando quieras.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-black/10 blur-2xl" />
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description, className = "" }: { icon: React.ReactNode, title: string, description: string, className?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-secondary/10">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
