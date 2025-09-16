
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/ui/button"

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <div className="h-12 w-40 overflow-hidden">
                        <Image
                            src="/seedor-logo-fondoblanco.png"
                            alt="Seedor"
                            width={200}
                            height={80}
                            className="h-full w-full object-cover"
                            priority
                        />
                    </div>
                </Link>

                {/* Navegación */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link
                        href="/faq"
                        className="text-sm font-medium text-gray-700 hover:text-primary"
                    >
                        FAQ
                    </Link>
                    <Link
                        href="/contacto"
                        className="text-sm font-medium text-gray-700 hover:text-primary"
                    >
                        Contáctenos
                    </Link>
                    <Link
                        href="/login"
                        className="text-sm font-medium text-gray-700 hover:text-primary"
                    >
                        Iniciar sesión
                    </Link>
                    <Link href="/register-tenant">
                        <Button size="sm" className="ml-2">
                            Crear campo
                        </Button>
                    </Link>
                </nav>
            </div>
        </header>
    )
}
