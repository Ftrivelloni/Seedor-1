"use client"

import { useState } from "react"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import Link from "next/link"

const funcionalidades = [
  { key: "campo", label: "Gestión de tareas de campo" },
  { key: "inventario", label: "Inventario" },
  { key: "empaque", label: "Empaque y trazabilidad" },
  { key: "finanzas", label: "Finanzas" },
]

export default function RegisterTenantForm() {
  const [nombre, setNombre] = useState("")
  const [contacto, setContacto] = useState("")
  const [cultivo, setCultivo] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  const handleFuncionalidad = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para guardar el tenant en backend o mocks
    setSuccess(true)
  }

  return (
    <div className="w-full max-w-2xl flex justify-center mx-auto">
      <Card className="w-full shadow-lg rounded-2xl border border-muted bg-white/90 px-10 py-10 flex flex-col justify-center" style={{ minWidth: 400, maxWidth: 600 }}>
        <CardContent className="w-full p-0">
          <h2 className="text-3xl font-bold mb-10 text-center text-primary">Registro de empresa</h2>
          <form className="space-y-8 w-full" onSubmit={handleSubmit}>
            <div className="space-y-4 w-full">
              <Label className="w-full mb-2">Nombre de la empresa</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} required className="h-12 text-base px-4 w-full border-2 border-muted rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" />
            </div>
            <div className="space-y-4 w-full">
              <Label className="w-full mb-2">Contacto</Label>
              <Input value={contacto} onChange={e => setContacto(e.target.value)} required className="h-12 text-base px-4 w-full border-2 border-muted rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" />
            </div>
            <div className="space-y-4 w-full">
              <Label className="w-full mb-2">Cultivo principal</Label>
              <Input value={cultivo} onChange={e => setCultivo(e.target.value)} required className="h-12 text-base px-4 w-full border-2 border-muted rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" />
            </div>
            {/* Se eliminó la selección de funcionalidades, ahora se realiza en la página separada */}
            {/* Sección de planes y beneficios */}
            <section className="w-full mt-14">
              <h3 className="text-2xl font-semibold mb-6 text-primary text-center">Planes y funcionalidades</h3>
            </section>
            <div className="mb-10 flex justify-center">
              <Link href="/funcionalidades" className="inline-block bg-primary text-primary-foreground px-3 py-1.5 rounded font-medium shadow hover:bg-primary/80 transition text-sm">
                Ver funcionalidades del sistema
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="border rounded-lg p-6 bg-card flex flex-col justify-between min-h-[220px]">
                <h4 className="font-bold text-lg mb-4">Plan Básico</h4>
                <ul className="mb-4 text-muted-foreground text-sm">
                  <li>A definir</li>
                </ul>
                <span className="font-bold text-primary">Gratis</span>
              </div>
              <div className="border rounded-lg p-6 bg-card flex flex-col justify-between min-h-[220px]">
                <h4 className="font-bold text-lg mb-4">Plan Pro</h4>
                <ul className="mb-4 text-muted-foreground text-sm">
                  <li>A definir</li>
                </ul>
                <span className="font-bold text-primary">$(...)/mes</span>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary text-white mt-12">Crear empresa</Button>
            {success && <p className="text-green-600 mt-4">¡Empresa registrada con éxito!</p>}
          </form>
          <Button
            variant="outline"
            className="w-full mt-6"
            onClick={() => window.location.href = "/"}
          >
            Volver a la página principal
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
