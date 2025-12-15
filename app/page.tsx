"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "../components/ui/button"
import { ArrowRight, Leaf, Warehouse, LineChart, ChevronDown, Users, Shield, BarChart3, Clock, CheckCircle, Star, Sparkles, TrendingUp, Zap, Target, Award, HeartHandshake } from "lucide-react"
import Header from "../components/header"
import { PrimaryButton, OutlineButton, CTAPrimaryButton, CTAOutlineButton } from "../components/landing/interactive-buttons"

export default function LandingPage() {
    const scrollToHero = () => {
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            heroSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-background">
                <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
                    {/* Background video - simple approach for reliable autoplay */}
                    <video
                        className="absolute inset-0 z-0 h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster="/Campo_panoramica.jpg"
                        aria-hidden="true"
                    >
                        <source src="/DroneView_h264.mp4" type="video/mp4" />
                    </video>


                    <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

                    <div className="relative z-20 mx-auto max-w-7xl px-6 text-center text-white flex flex-col justify-center min-h-screen py-20 pt-32">
                        <div className="mb-8 animate-fade-in-up">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-300 cursor-pointer" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                <Star className="h-4 w-4" />
                                Plataforma #1 en gestión agropecuaria
                            </span>
                        </div>

                        <div className="mb-12 animate-fade-in-up delay-200">
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <Image
                                    src="/logo-seedor.png"
                                    alt="Seedor"
                                    width={60}
                                    height={60}
                                    className="object-contain drop-shadow-2xl"
                                    priority
                                />
                                <h1 className="text-5xl font-black tracking-tight text-white" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    Seedor
                                </h1>
                            </div>
                        </div>

                        <div className="animate-fade-in-up delay-400">
                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl leading-tight bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                Simplificá la gestión agropecuaria
                            </h2>
                            <p className="mt-6 text-base text-white/90 sm:text-lg max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                La plataforma integral que necesitás para administrar tu campo de manera profesional y eficiente.
                            </p>

                            <div className="mt-12 mb-20 flex justify-center">
                                <button
                                    onClick={scrollToHero}
                                    className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer"
                                    style={{ fontFamily: 'Circular Std, sans-serif' }}
                                >
                                    Descubrir más
                                    <ChevronDown className="h-5 w-5 animate-bounce" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-green-50/50 to-white">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-green-100/20 via-transparent to-transparent" />
                    <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 md:pt-32 md:pb-24">
                        <div className="text-center mb-20">
                            <div className="animate-fade-in-up">
                                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 mb-6" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    <CheckCircle className="h-4 w-4" />
                                    Solución completa
                                </span>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    Gestioná tu campo de manera <span style={{ color: '#63bd0a' }}>inteligente</span>
                                </h1>
                                <p className="mt-8 text-lg text-slate-600 max-w-4xl mx-auto font-medium leading-relaxed" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    Centralizá tareas de campo, inventario, empaque y finanzas en una sola plataforma diseñada específicamente para operaciones agropecuarias modernas y eficientes.
                                </p>
                            </div>

                            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up delay-200">
                                <PrimaryButton href="/register-tenant">
                                    Crear mi campo gratis
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </PrimaryButton>
                                <OutlineButton href="/login">
                                    Iniciar sesión
                                </OutlineButton>
                            </div>

                            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up delay-400">
                                <div className="text-center group cursor-pointer">
                                    <div className="text-4xl font-black transition-all duration-300 group-hover:scale-110" style={{ color: '#63bd0a', fontFamily: 'Circular Std, sans-serif' }}>500+</div>
                                    <div className="text-sm text-slate-600 font-semibold mt-2" style={{ fontFamily: 'Circular Std, sans-serif' }}>Campos activos</div>
                                </div>
                                <div className="text-center group cursor-pointer">
                                    <div className="text-4xl font-black transition-all duration-300 group-hover:scale-110" style={{ color: '#f3b31a', fontFamily: 'Circular Std, sans-serif' }}>50K+</div>
                                    <div className="text-sm text-slate-600 font-semibold mt-2" style={{ fontFamily: 'Circular Std, sans-serif' }}>Hectáreas gestionadas</div>
                                </div>
                                <div className="text-center group cursor-pointer">
                                    <div className="text-4xl font-black transition-all duration-300 group-hover:scale-110" style={{ color: '#f87163', fontFamily: 'Circular Std, sans-serif' }}>99%</div>
                                    <div className="text-sm text-slate-600 font-semibold mt-2" style={{ fontFamily: 'Circular Std, sans-serif' }}>Tiempo de actividad</div>
                                </div>
                                <div className="text-center group cursor-pointer">
                                    <div className="text-4xl font-black transition-all duration-300 group-hover:scale-110" style={{ color: '#f56b8b', fontFamily: 'Circular Std, sans-serif' }}>24/7</div>
                                    <div className="text-sm text-slate-600 font-semibold mt-2" style={{ fontFamily: 'Circular Std, sans-serif' }}>Soporte técnico</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 pt-16 pb-16 md:pt-24 md:pb-24">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <h2 className="text-3xl font-black text-slate-900 sm:text-4xl lg:text-5xl" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                            Todo lo que necesitás en <span style={{ color: '#63bd0a' }}>un solo lugar</span>
                        </h2>
                        <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                            Herramientas poderosas diseñadas específicamente para la gestión agropecuaria moderna
                        </p>
                    </div>

                    <div className="grid gap-12 md:gap-16 md:grid-cols-3">
                        <FeatureCard
                            icon={<Leaf className="h-12 w-12" style={{ color: '#63bd0a' }} />}
                            title="Gestión de Campo"
                            description="Planificá, asigná y hacé seguimiento de todas las tareas de campo en tiempo real. Control total de cultivos, lotes y actividades diarias."
                            features={["Planificación de tareas", "Seguimiento de cultivos", "Gestión de lotes", "Reportes automáticos"]}
                            className="animate-fade-in-up delay-200"
                            color="#63bd0a"
                        />
                        <FeatureCard
                            icon={<Warehouse className="h-12 w-12" style={{ color: '#f3b31a' }} />}
                            title="Inventario y Empaque"
                            description="Controlá insumos, cosecha y empaque con visibilidad total. Optimizá tu cadena de suministro y maximizá la eficiencia."
                            features={["Control de stock", "Trazabilidad completa", "Gestión de pallets", "Optimización de procesos"]}
                            className="animate-fade-in-up delay-400"
                            color="#f3b31a"
                        />
                        <FeatureCard
                            icon={<LineChart className="h-12 w-12" style={{ color: '#f87163' }} />}
                            title="Finanzas Inteligentes"
                            description="Costos, egresos e ingresos siempre a mano para tomar mejores decisiones. Análisis financiero detallado y proyecciones."
                            features={["Dashboard financiero", "Análisis de costos", "Proyecciones", "Reportes detallados"]}
                            className="animate-fade-in-up delay-600"
                            color="#f87163"
                        />
                    </div>
                </section>

                <section className="bg-gradient-to-r from-green-50 to-lime-50 py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="animate-fade-in-up">
                                <h2 className="text-3xl font-black text-slate-900 sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    ¿Por qué elegir <span style={{ color: '#63bd0a' }}>Seedor</span>?
                                </h2>
                                <p className="mt-6 text-lg text-slate-600 font-medium leading-relaxed" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    Más que un software, somos tu socio tecnológico para hacer crecer tu operación agropecuaria.
                                </p>
                                <div className="mt-8 space-y-6">
                                    <BenefitItem
                                        icon={<Users className="h-6 w-6" style={{ color: '#63bd0a' }} />}
                                        title="Equipo especializado"
                                        description="Desarrollado por expertos en agro y tecnología"
                                        color="#63bd0a"
                                    />
                                    <BenefitItem
                                        icon={<Shield className="h-6 w-6" style={{ color: '#f3b31a' }} />}
                                        title="Datos seguros"
                                        description="Máxima seguridad y respaldo de tu información"
                                        color="#f3b31a"
                                    />
                                    <BenefitItem
                                        icon={<Clock className="h-6 w-6" style={{ color: '#f87163' }} />}
                                        title="Ahorro de tiempo"
                                        description="Hasta 70% menos tiempo en tareas administrativas"
                                        color="#f87163"
                                    />
                                </div>
                            </div>
                            <div className="animate-fade-in-up delay-200">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-20" style={{ background: 'linear-gradient(135deg, #f56b8b, #f96c57)' }}></div>
                                    <div className="relative bg-white rounded-2xl p-8 shadow-2xl border-2" style={{ borderColor: '#f56b8b' }}>
                                        <BarChart3 className="h-16 w-16 mb-6" style={{ color: '#f56b8b' }} />
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                            Incrementá tu productividad
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>Eficiencia operativa</span>
                                                <span className="font-black text-xl" style={{ color: '#63bd0a', fontFamily: 'Circular Std, sans-serif' }}>+85%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>Reducción de costos</span>
                                                <span className="font-black text-xl" style={{ color: '#f3b31a', fontFamily: 'Circular Std, sans-serif' }}>-30%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>Control de inventario</span>
                                                <span className="font-black text-xl" style={{ color: '#f87163', fontFamily: 'Circular Std, sans-serif' }}>+95%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 pt-16 pb-16 md:pt-24 md:pb-24">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <h2 className="text-3xl font-black text-slate-900 sm:text-4xl lg:text-5xl mb-4" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                            Características <span style={{ color: '#f56b8b' }}>destacadas</span>
                        </h2>
                        <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                            Herramientas avanzadas que transforman tu forma de trabajar
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <ExtraFeatureCard
                            icon={<Sparkles className="h-10 w-10" style={{ color: '#f56b8b' }} />}
                            title="Automatización Inteligente"
                            description="Automatizá tareas repetitivas y enfocate en lo que realmente importa."
                            color="#f56b8b"
                        />
                        <ExtraFeatureCard
                            icon={<TrendingUp className="h-10 w-10" style={{ color: '#f96c57' }} />}
                            title="Análisis Predictivo"
                            description="Proyecciones y tendencias para tomar decisiones informadas."
                            color="#f96c57"
                        />
                        <ExtraFeatureCard
                            icon={<Zap className="h-10 w-10" style={{ color: '#63bd0a' }} />}
                            title="Acceso en Tiempo Real"
                            description="Sincronización instantánea en todos tus dispositivos."
                            color="#63bd0a"
                        />
                        <ExtraFeatureCard
                            icon={<Target className="h-10 w-10" style={{ color: '#f3b31a' }} />}
                            title="Reportes Personalizados"
                            description="Creá reportes a medida según tus necesidades específicas."
                            color="#f3b31a"
                        />
                        <ExtraFeatureCard
                            icon={<Award className="h-10 w-10" style={{ color: '#f87163' }} />}
                            title="Cumplimiento Normativo"
                            description="Mantené tu operación en línea con todas las regulaciones."
                            color="#f87163"
                        />
                        <ExtraFeatureCard
                            icon={<HeartHandshake className="h-10 w-10" style={{ color: '#f56b8b' }} />}
                            title="Soporte Premium"
                            description="Equipo dedicado para ayudarte cuando lo necesites."
                            color="#f56b8b"
                        />
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 pb-24 md:pb-32 pt-24 md:pt-32">
                    <div className="relative overflow-hidden rounded-3xl p-1 shadow-2xl animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #63bd0a, #f3b31a, #f87163)' }}>
                        <div className="relative bg-white rounded-[calc(1.5rem-4px)] p-12 md:p-16 text-center">
                            <h2 className="text-2xl font-black md:text-3xl lg:text-4xl leading-tight text-slate-900" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                Empezá gratis y escalá a tu ritmo
                            </h2>
                            <p className="mt-6 text-lg md:text-xl font-medium leading-relaxed max-w-3xl mx-auto text-slate-600" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                Creá tu cuenta en menos de 2 minutos. Sin compromisos, sin tarjeta de crédito. Sumá a tu equipo cuando quieras.
                            </p>
                            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
                                <CTAPrimaryButton href="/register-tenant">
                                    Comenzar ahora
                                    <ArrowRight className="ml-3 h-6 w-6" />
                                </CTAPrimaryButton>
                                <CTAOutlineButton href="/demo">
                                    Ver demo
                                </CTAOutlineButton>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

function FeatureCard({
    icon,
    title,
    description,
    features,
    className = "",
    color = "#63bd0a"
}: {
    icon: React.ReactNode
    title: string
    description: string
    features: string[]
    className?: string
    color?: string
}) {
    return (
        <div className={`group relative ${className}`}>
            <div className="relative h-full bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border-2" style={{ borderColor: color }}>
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: `linear-gradient(135deg, ${color}15, transparent)` }}></div>
                <div className="relative">
                    <div className="mb-6 inline-flex p-4 rounded-xl transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
                        {icon}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4 transition-colors duration-300" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                        {title}
                    </h3>
                    <p className="text-slate-600 text-lg font-medium leading-relaxed mb-6" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                        {description}
                    </p>
                    <ul className="space-y-3">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-center text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" style={{ color }} />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

function BenefitItem({
    icon,
    title,
    description,
    color = "#63bd0a"
}: {
    icon: React.ReactNode
    title: string
    description: string
    color?: string
}) {
    return (
        <div className="flex items-start space-x-4 group cursor-pointer">
            <div className="flex-shrink-0 p-3 rounded-xl transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
                {icon}
            </div>
            <div>
                <h4 className="text-lg font-black text-slate-900" style={{ fontFamily: 'Circular Std, sans-serif' }}>{title}</h4>
                <p className="text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>{description}</p>
            </div>
        </div>
    )
}

function ExtraFeatureCard({
    icon,
    title,
    description,
    color = "#63bd0a"
}: {
    icon: React.ReactNode
    title: string
    description: string
    color?: string
}) {
    return (
        <div className="group relative animate-fade-in-up">
            <div className="relative h-full bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-l-4" style={{ borderLeftColor: color }}>
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-3 rounded-lg transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}10` }}>
                        {icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                            {title}
                        </h3>
                        <p className="text-slate-600 text-sm font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
