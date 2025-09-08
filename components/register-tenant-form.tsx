"use client"

import { useState } from "react"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

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
      <Card className="w-full shadow-lg rounded-2xl border border-muted bg-white/90 px-16 py-12 flex flex-col justify-center" style={{ minWidth: 400, maxWidth: 600 }}>
        <CardContent className="w-full p-0">
          <h2 className="text-3xl font-bold mb-8 text-center text-primary">Registro de empresa</h2>
          <form className="space-y-6 w-full" onSubmit={handleSubmit}>
            <div className="space-y-3 w-full">
              <Label className="w-full mb-3">Nombre de la empresa</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} required className="h-12 text-base px-4 w-full border-2 border-muted rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" />
            </div>
            <div className="space-y-3 w-full">
              <Label className="w-full mb-3">Contacto</Label>
              <Input value={contacto} onChange={e => setContacto(e.target.value)} required className="h-12 text-base px-4 w-full border-2 border-muted rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" />
            </div>
            <div className="space-y-3 w-full">
              <Label className="w-full mb-3">Cultivo principal</Label>
              <Input value={cultivo} onChange={e => setCultivo(e.target.value)} required className="h-12 text-base px-4 w-full border-2 border-muted rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" />
            </div>
            <div className="space-y-3 w-full">
              <Label className="w-full mb-1">Funcionalidades</Label>
              <div className="flex flex-wrap gap-3 mt-6 w-full">
                {funcionalidades.map(f => (
                  <Button
                    key={f.key}
                    type="button"
                    variant={selected.includes(f.key) ? "default" : "outline"}
                    onClick={() => handleFuncionalidad(f.key)}
                    className="min-w-[180px]"
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
            {/* Sección de planes y beneficios */}
            <section className="w-full mt-12">
              <h3 className="text-2xl font-semibold mb-8 text-primary text-center">Planes y funcionalidades</h3>
            </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="border rounded-lg p-6 bg-card flex flex-col justify-between min-h-[220px]">
                    <h4 className="font-bold text-lg mb-3">Plan Básico</h4>
                    <ul className="mb-3 text-muted-foreground text-sm">
                      <li>Gestión de tareas de campo</li>
                      <li>Inventario</li>
                    </ul>
                    <span className="font-bold text-primary">Gratis</span>
                  </div>
                  <div className="border rounded-lg p-6 bg-card flex flex-col justify-between min-h-[220px]">
                    <h4 className="font-bold text-lg mb-3">Plan Pro</h4>
                    <ul className="mb-3 text-muted-foreground text-sm">
                      <li>Todo lo del Básico</li>
                      <li>Empaque y trazabilidad</li>
                      <li>Finanzas</li>
                    </ul>
                    <span className="font-bold text-primary">$5000/mes</span>
                  </div>
                </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary text-white mt-10">Crear empresa</Button>
            {success && <p className="text-green-600 mt-2">¡Empresa registrada con éxito!</p>}
          </form>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => window.location.href = "/"}
          >
            Volver a la página principal
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
