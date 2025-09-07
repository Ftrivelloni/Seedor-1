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
    <Card className="w-full max-w-lg">
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>Nombre de la empresa</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} required />
          </div>
          <div>
            <Label>Contacto</Label>
            <Input value={contacto} onChange={e => setContacto(e.target.value)} required />
          </div>
          <div>
            <Label>Cultivo principal</Label>
            <Input value={cultivo} onChange={e => setCultivo(e.target.value)} required />
          </div>
          <div>
            <Label>Funcionalidades</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {funcionalidades.map(f => (
                <Button
                  key={f.key}
                  type="button"
                  variant={selected.includes(f.key) ? "default" : "outline"}
                  onClick={() => handleFuncionalidad(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
          {/* Sección de planes y beneficios */}
          <section className="w-full max-w-3xl mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Planes y funcionalidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="font-bold text-lg mb-2">Plan Básico</h3>
                <ul className="mb-2 text-muted-foreground text-sm">
                  <li>Gestión de tareas de campo</li>
                  <li>Inventario</li>
                </ul>
                <span className="font-bold text-primary">Gratis</span>
              </div>
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="font-bold text-lg mb-2">Plan Pro</h3>
                <ul className="mb-2 text-muted-foreground text-sm">
                  <li>Todo lo del Básico</li>
                  <li>Empaque y trazabilidad</li>
                  <li>Finanzas</li>
                </ul>
                <span className="font-bold text-primary">$5000/mes</span>
              </div>
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="font-bold text-lg mb-2">Plan Empresa</h3>
                <ul className="mb-2 text-muted-foreground text-sm">
                  <li>Todo lo del Pro</li>
                  <li>Soporte prioritario</li>
                  <li>Integraciones personalizadas</li>
                </ul>
                <span className="font-bold text-primary">Consultar</span>
              </div>
            </div>
          </section>
          <Button type="submit" className="w-full bg-primary text-white mt-8">Crear empresa</Button>
          {success && <p className="text-green-600 mt-2">¡Empresa registrada con éxito!</p>}
        </form>
      </CardContent>
    </Card>
  )
}
