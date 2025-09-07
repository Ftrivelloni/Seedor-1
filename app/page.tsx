import Link from "next/link"
import { Button } from "../components/ui/button"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold mb-4 text-primary">Gestioná tu campo de manera simple</h1>
      <p className="mb-8 text-muted-foreground text-center max-w-xl">
        Centralizá la gestión de tareas, inventario, empaque y finanzas en una sola plataforma.
      </p>
      <div className="flex gap-4 mb-8">
        <Link href="/register-tenant">
          <Button size="lg" className="bg-primary text-white">Crear mi campo/tenant</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline">Iniciar sesión</Button>
        </Link>
      </div>
    </main>
  )
}
