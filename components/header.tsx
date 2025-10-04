import Link from "next/link"
import Image from "next/image"
import { Button } from "@/ui/button"

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                {/* Logo actualizado */}
                <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity duration-200">
                    <Image
                        src="/logo-seedor.png"
                        alt="Seedor"
                        width={36}
                        height={36}
                        className="object-contain"
                        priority
                    />
                    <span className="text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: 'Circular Std, sans-serif' }}>
                        Seedor
                    </span>
                </Link>

                {/* Navegación */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link
                        href="/faq"
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer transition-colors duration-200 relative group"
                        style={{ fontFamily: 'Circular Std, sans-serif' }}
                    >
                        FAQ
                        <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                    </Link>
                    <Link
                        href="/contacto"
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer transition-colors duration-200 relative group"
                        style={{ fontFamily: 'Circular Std, sans-serif' }}
                    >
                        Contáctenos
                        <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                    </Link>
                    <Link
                        href="/login"
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer transition-colors duration-200 relative group"
                        style={{ fontFamily: 'Circular Std, sans-serif' }}
                    >
                        Iniciar sesión
                        <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                    </Link>
                    <Link href="/register-tenant">
                        <Button 
                            className="ml-4 px-6 py-2.5 text-sm font-semibold rounded-lg cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                            style={{ 
                                backgroundColor: '#73AC01', 
                                color: 'white',
                                fontFamily: 'Circular Std, sans-serif',
                                border: 'none'
                            }}
                        >
                            Crear usuario
                        </Button>
                    </Link>
                </nav>

                {/* Menú móvil - botón hamburguesa */}
                <div className="md:hidden">
                    <button className="p-2 text-gray-700 hover:text-gray-900 transition-colors duration-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    )
}
