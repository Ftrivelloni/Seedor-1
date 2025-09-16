import Link from "next/link"
import Image from "next/image"
import { Button } from "../components/ui/button"
import { ArrowRight, Leaf, Warehouse, LineChart, ChevronDown } from "lucide-react"
import Header from "../components/header"   // 👈 Importamos el header

export default function LandingPage() {
    return (
        <>
            {/* Header fijo */}
            <Header />

            {/* Main con padding-top para no tapar el contenido */}
            <main className="min-h-screen bg-background pt-16">
                {/* Welcome Intro */}
                <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
                    {/* VIDEO de fondo */}
                    <video
                        className="absolute inset-0 z-0 h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster="/Campo_panoramica.jpg"
                        aria-hidden="true"
                    >
                        <source src="/DroneView.webm" type="video/webm" />
                        <source src="/DroneView.mp4" type="video/mp4" />
                    </video>

                    {/* Scrim/overlay para contraste */}
                    <div className="absolute inset-0 z-10 bg-black/40" />

                    {/* Contenido */}
                    <div className="relative z-20 mx-auto max-w-6xl px-6 text-center text-white">
                        <div className="mx-auto -mt-40 mb-20 sm:-mt-40 sm:mb-8">
                            <Image
                                src="/seedor-logo-no-bg.png"
                                alt="Seedor"
                                width={900}
                                height={200}
                                className="mx-auto object-contain"
                                priority
                            />
                        </div>
                        <div className="-mt-20 sm:-mt-26">
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                                Simplificá la gestión agropecuaria
                            </h1>
                            <p className="mt-4 text-base text-white/90 sm:text-lg">
                                Con Seedor tenés todo lo que necesitás para administrar tu campo.
                            </p>
                            <div className="mt-12 flex justify-center">
                                <a
                                    href="#hero"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20 transition-colors"
                                >
                                    Comenzar
                                    <ChevronDown className="size-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <section id="hero" className="relative overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/5 via-transparent to-transparent" />
                    <div className="mx-auto max-w-6xl px-6 pt-24 pb-0 md:pt-16 md:pb-0">
                        <div className="grid items-center gap-8 md:gap-10 md:grid-cols-1 text-center">
                            <div>
                                <h1 className="mt-0 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-slide-in-up">
                                    Gestioná tu campo de manera simple.
                                </h1>
                                <p className="mt-6 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto animate-slide-in-up [animation-delay:200ms]">
                                    Centralizá tareas, inventario, empaque y finanzas en una sola plataforma diseñada para operaciones agropecuarias modernas.
                                </p>
                                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up [animation-delay:400ms]">
                                    <Link href="/register-tenant">
                                        <Button size="lg" className="gap-2">
                                            Crear mi campo
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </Link>
                                    <Link href="/login">
                                        <Button size="lg" variant="ghost">
                                            Iniciar sesión
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
                            icon={<Leaf className="size-7 text-secondary" />}
                            title="Tareas de campo"
                            description="Planificá, asigná y hacé seguimiento del trabajo diario en tiempo real."
                            className="animate-slide-in-up [animation-delay:200ms]"
                        />
                        <FeatureCard
                            icon={<Warehouse className="size-7 text-secondary" />}
                            title="Inventario y empaque"
                            description="Controlá insumos, cosecha y empaque con visibilidad total."
                            className="animate-slide-in-up [animation-delay:400ms]"
                        />
                        <FeatureCard
                            icon={<LineChart className="size-7 text-secondary" />}
                            title="Finanzas claras"
                            description="Costos, egresos e ingresos siempre a mano para decidir mejor."
                            className="animate-slide-in-up [animation-delay:600ms]"
                        />
                    </div>
                </section>

                {/* CTA */}
                <section className="mx-auto max-w-6xl px-6 pb-24 md:pb-32 pt-6 md:pt-6">
                    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-secondary to-primary p-8 md:p-12 text-primary-foreground animate-slide-in-up [animation-delay:800ms] text-center">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold md:text-3xl">Empezá gratis y escalá a tu ritmo.</h2>
                            <p className="mt-3 text-sm/6 opacity-90 md:text-base/7">
                                Creá tu tenant en menos de 2 minutos. Sumá a tu equipo cuando quieras.
                            </p>
                            <div className="mt-6 flex justify-center">
                                <Link href="/register-tenant">
                                    <Button size="lg" className="gap-2 bg-white text-primary hover:bg-white/90">
                                        Crear mi campo ahora
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-black/10 blur-2xl" />
                    </div>
                </section>
            </main>
        </>
    )
}

function FeatureCard({ icon, title, description, className = "" }: { icon: React.ReactNode, title: string, description: string, className?: string }) {
    return (
        <div className={`rounded-xl border bg-white/70 backdrop-blur p-6 shadow-md transition-transform hover:scale-105 hover:shadow-lg ${className}`}>
            <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-secondary/10">
                    {icon}
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        </div>
    )
}
