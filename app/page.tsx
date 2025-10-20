"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "../components/ui/button"
import { ArrowRight, Leaf, Warehouse, LineChart, ChevronDown, Users, Shield, BarChart3, Clock, CheckCircle, Star } from "lucide-react"
import Header from "../components/header"

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
                                <h1 className="text-6xl font-black tracking-tight text-white" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    Seedor
                                </h1>
                            </div>
                        </div>

                        <div className="animate-fade-in-up delay-400">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-tight bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                Simplificá la gestión agropecuaria
                            </h2>
                            <p className="mt-6 text-lg text-white/90 sm:text-xl max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Circular Std, sans-serif' }}>
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
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-tight" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    Gestioná tu campo de manera <span style={{ color: '#73AC01' }}>inteligente</span>
                                </h1>
                                <p className="mt-8 text-xl text-slate-600 max-w-4xl mx-auto font-medium leading-relaxed" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    Centralizá tareas de campo, inventario, empaque y finanzas en una sola plataforma diseñada específicamente para operaciones agropecuarias modernas y eficientes.
                                </p>
                            </div>
                            
                            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up delay-200">
                                <Link href="/register-tenant">
                                    <Button size="lg" className="cursor-pointer px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#73AC01', color: 'white', fontFamily: 'Circular Std, sans-serif' }}>
                                        Crear mi campo gratis
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button size="lg" variant="outline" className="cursor-pointer px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105" style={{ borderColor: '#73AC01', color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>
                                        Iniciar sesión
                                    </Button>
                                </Link>
                            </div>

                            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up delay-400">
                                <div className="text-center">
                                    <div className="text-3xl font-black" style={{ color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>500+</div>
                                    <div className="text-sm text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>Campos activos</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black" style={{ color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>50K+</div>
                                    <div className="text-sm text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>Hectáreas gestionadas</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black" style={{ color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>99%</div>
                                    <div className="text-sm text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>Tiempo de actividad</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black" style={{ color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>24/7</div>
                                    <div className="text-sm text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>Soporte técnico</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 pt-16 pb-16 md:pt-24 md:pb-24">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <h2 className="text-3xl font-black text-slate-900 sm:text-4xl lg:text-5xl" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                            Todo lo que necesitás en <span style={{ color: '#73AC01' }}>un solo lugar</span>
                        </h2>
                        <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                            Herramientas poderosas diseñadas específicamente para la gestión agropecuaria moderna
                        </p>
                    </div>
                    
                    <div className="grid gap-12 md:gap-16 md:grid-cols-3">
                        <FeatureCard
                            icon={<Leaf className="h-12 w-12" style={{ color: '#73AC01' }} />}
                            title="Gestión de Campo"
                            description="Planificá, asigná y hacé seguimiento de todas las tareas de campo en tiempo real. Control total de cultivos, lotes y actividades diarias."
                            features={["Planificación de tareas", "Seguimiento de cultivos", "Gestión de lotes", "Reportes automáticos"]}
                            className="animate-fade-in-up delay-200"
                        />
                        <FeatureCard
                            icon={<Warehouse className="h-12 w-12" style={{ color: '#73AC01' }} />}
                            title="Inventario y Empaque"
                            description="Controlá insumos, cosecha y empaque con visibilidad total. Optimizá tu cadena de suministro y maximizá la eficiencia."
                            features={["Control de stock", "Trazabilidad completa", "Gestión de pallets", "Optimización de procesos"]}
                            className="animate-fade-in-up delay-400"
                        />
                        <FeatureCard
                            icon={<LineChart className="h-12 w-12" style={{ color: '#73AC01' }} />}
                            title="Finanzas Inteligentes"
                            description="Costos, egresos e ingresos siempre a mano para tomar mejores decisiones. Análisis financiero detallado y proyecciones."
                            features={["Dashboard financiero", "Análisis de costos", "Proyecciones", "Reportes detallados"]}
                            className="animate-fade-in-up delay-600"
                        />
                    </div>
                </section>

                <section className="bg-gradient-to-r from-green-50 to-lime-50 py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="animate-fade-in-up">
                                <h2 className="text-3xl font-black text-slate-900 sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    ¿Por qué elegir <span style={{ color: '#73AC01' }}>Seedor</span>?
                                </h2>
                                <p className="mt-6 text-lg text-slate-600 font-medium leading-relaxed" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                    Más que un software, somos tu socio tecnológico para hacer crecer tu operación agropecuaria.
                                </p>
                                <div className="mt-8 space-y-6">
                                    <BenefitItem 
                                        icon={<Users className="h-6 w-6" style={{ color: '#73AC01' }} />}
                                        title="Equipo especializado"
                                        description="Desarrollado por expertos en agro y tecnología"
                                    />
                                    <BenefitItem 
                                        icon={<Shield className="h-6 w-6" style={{ color: '#73AC01' }} />}
                                        title="Datos seguros"
                                        description="Máxima seguridad y respaldo de tu información"
                                    />
                                    <BenefitItem 
                                        icon={<Clock className="h-6 w-6" style={{ color: '#73AC01' }} />}
                                        title="Ahorro de tiempo"
                                        description="Hasta 70% menos tiempo en tareas administrativas"
                                    />
                                </div>
                            </div>
                            <div className="animate-fade-in-up delay-200">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-20" style={{ background: 'linear-gradient(135deg, #73AC01, #8BC34A)' }}></div>
                                    <div className="relative bg-white rounded-2xl p-8 shadow-2xl" style={{ border: '1px solid #73AC01' }}>
                                        <BarChart3 className="h-16 w-16 mb-6" style={{ color: '#73AC01' }} />
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                            Incrementá tu productividad
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600" style={{ fontFamily: 'Circular Std, sans-serif' }}>Eficiencia operativa</span>
                                                <span className="font-bold" style={{ color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>+85%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600" style={{ fontFamily: 'Circular Std, sans-serif' }}>Reducción de costos</span>
                                                <span className="font-bold" style={{ color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>-30%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600" style={{ fontFamily: 'Circular Std, sans-serif' }}>Control de inventario</span>
                                                <span className="font-bold" style={{ color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>+95%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 pb-24 md:pb-32 pt-24 md:pt-32">
                    <div className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-white text-center shadow-2xl animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #73AC01, #8BC34A)' }}>
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.05%3E%3Ccircle cx=30 cy=30 r=4/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
                        
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black md:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                Empezá gratis y escalá a tu ritmo
                            </h2>
                            <p className="mt-6 text-xl md:text-2xl opacity-90 font-medium leading-relaxed max-w-3xl mx-auto" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                Creá tu cuenta en menos de 2 minutos. Sin compromisos, sin tarjeta de crédito. Sumá a tu equipo cuando quieras.
                            </p>
                            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
                                <Link href="/register-tenant">
                                    <Button size="lg" className="cursor-pointer bg-white hover:bg-gray-50 px-10 py-4 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" style={{ color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>
                                        Comenzar ahora
                                        <ArrowRight className="ml-3 h-6 w-6" />
                                    </Button>
                                </Link>
                                <Link href="/demo">
                                    <Button size="lg" variant="outline" className="cursor-pointer border-white/30 text-white hover:bg-white/10 px-10 py-4 text-xl font-semibold rounded-xl transition-all duration-300 hover:scale-105" style={{color: '#73AC01', fontFamily: 'Circular Std, sans-serif' }}>
                                        Ver demo
                                    </Button>
                                </Link>
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
    className = "" 
}: { 
    icon: React.ReactNode
    title: string
    description: string
    features: string[]
    className?: string 
}) {
    return (
        <div className={`group relative ${className}`}>
            <div className="relative h-full bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer" style={{ border: '1px solid #73AC01' }}>
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(115, 172, 1, 0.05), transparent)' }}></div>
                <div className="relative">
                    <div className="mb-6 inline-flex p-4 rounded-xl group-hover:bg-green-100 transition-colors duration-300" style={{ backgroundColor: 'rgba(115, 172, 1, 0.1)' }}>
                        {icon}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 transition-colors duration-300" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                        {title}
                    </h3>
                    <p className="text-slate-600 text-lg font-medium leading-relaxed mb-6" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                        {description}
                    </p>
                    <ul className="space-y-3">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-center text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" style={{ color: '#73AC01' }} />
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
    description 
}: { 
    icon: React.ReactNode
    title: string
    description: string 
}) {
    return (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: 'rgba(115, 172, 1, 0.1)' }}>
                {icon}
            </div>
            <div>
                <h4 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Circular Std, sans-serif' }}>{title}</h4>
                <p className="text-slate-600 font-medium" style={{ fontFamily: 'Circular Std, sans-serif' }}>{description}</p>
            </div>
        </div>
    )
}
