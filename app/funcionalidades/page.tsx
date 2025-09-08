"use client"
import Link from "next/link"
import { useState, useEffect } from "react"

// Funcionalidades agrupadas por sección, diferenciando obligatorias y opcionales
const funcionalidadesPorSeccion = [
  {
    seccion: "Gestión de usuarios",
    items: [
      { texto: "Asignación de roles/áreas.", tipo: "obligatoria" },
      { texto: "Control de acceso por roles.", tipo: "obligatoria" }
    ]
  },
  {
    seccion: "Gestión de campo",
    items: [
      { texto: "Cálculo de rendimientos por lotes.", tipo: "obligatoria" },
      { texto: "Creación y asignación de tareas de campo.", tipo: "opcional" },
      { texto: "Calendario de actividades y recordatorios.", tipo: "opcional" },
      { texto: "Seguimiento de estado de tareas (pendiente, en curso, completada).", tipo: "opcional" }
    ]
  },
  {
    seccion: "Gestión de empaque",
    items: [
      { texto: "Registro de fruta/cosecha procesada.", tipo: "obligatoria" },
      { texto: "Clasificación de mercado vs. descarte.", tipo: "obligatoria" },
      { texto: "Control de lotes.", tipo: "obligatoria" },
      { texto: "Exportación de datos a Excel.", tipo: "opcional" },
      { texto: "Control de pallets (lectura de código de barra o QR).", tipo: "opcional" }
    ]
  },
  {
    seccion: "Módulo de inventario",
    items: [
      { texto: "Registro de insumos, pallets, cajas, repuestos.", tipo: "obligatoria" },
      { texto: "Ajustes rápidos de stock (+, -).", tipo: "obligatoria" },
      { texto: "Alertas de bajo stock.", tipo: "opcional" }
    ]
  },
  {
    seccion: "Gestión de finanzas",
    items: [
      { texto: "Registro de ingresos y egresos.", tipo: "obligatoria" },
      { texto: "Manejo de la caja chica.", tipo: "opcional" }
    ]
  },
  {
    seccion: "Gestión de trabajadores",
    items: [
      { texto: "Creación de trabajadores.", tipo: "obligatoria" },
      { texto: "Asignación de rol del trabajador.", tipo: "obligatoria" },
      { texto: "Stats de asistencia.", tipo: "opcional" }
    ]
  },
  {
    seccion: "Apartado de contactos",
    items: [
      { texto: "Registrar y consultar contactos asociados a la operación del campo.", tipo: "opcional" }
    ]
  },
]

export default function FuncionalidadesTenant() {
  const [seleccionadas, setSeleccionadas] = useState<string[]>([])

  // Persistencia con localStorage
  useEffect(() => {
    const saved = localStorage.getItem("funcionalidadesSeleccionadas")
    if (saved) setSeleccionadas(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem("funcionalidadesSeleccionadas", JSON.stringify(seleccionadas))
  }, [seleccionadas])

  const handleToggle = (funcionalidad: string) => {
    setSeleccionadas(prev =>
      prev.includes(funcionalidad)
        ? prev.filter(f => f !== funcionalidad)
        : [...prev, funcionalidad]
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto bg-card rounded-2xl shadow-lg border border-muted p-8 md:p-12">
  <h1 className="text-3xl font-extrabold mb-4 text-center text-primary">Funcionalidades del sistema</h1>
  <div className="h-4" />
        <p className="text-base text-muted-foreground text-center mb-8 max-w-xl mx-auto">
          <span className="block text-xl font-bold text-black mb-6">¡Conocé las funcionalidades que ofrecemos!</span>
          <span className="font-semibold text-yellow-500">Las resaltadas en amarillo son obligatorias</span> y <span className="font-semibold text-green-600">las verdes son opcionales</span>, podés elegir cuáles activar para tu gestión personalizada.
        </p>
        <section className="mb-8">
          <h2 className="text-xl mb-4 text-black">Funcionalidades por módulo</h2>
          <div className="space-y-4">
            {funcionalidadesPorSeccion.map((grupo, idx) => (
              <details key={idx} className="bg-muted/40 rounded-xl border border-muted">
                <summary className="cursor-pointer px-4 py-3 font-semibold text-primary select-none text-lg">{grupo.seccion}</summary>
                <ul className="space-y-2 px-4 pb-4 pt-2">
                  {grupo.items.map((item, i) => (
                    <li key={i} className={item.tipo === "obligatoria"
                      ? "bg-yellow-100 rounded px-3 py-2 font-medium flex items-center gap-2 border border-yellow-200"
                      : "bg-green-100 rounded px-3 py-2 font-medium flex items-center gap-2 border border-green-200"}>
                      {item.tipo === "opcional" ? (
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(item.texto)}
                          onChange={() => handleToggle(item.texto)}
                          className="accent-green-600 mr-2"
                        />
                      ) : null}
                      <span className={item.tipo === "obligatoria" ? "text-yellow-700" : "text-green-700"}>●</span> {item.texto}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
        <div className="flex justify-center mt-10">
          <Link href="/register-tenant" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded font-semibold shadow hover:bg-primary/80 transition">Volver al registro</Link>
        </div>
      </div>
    </main>
  )
}
