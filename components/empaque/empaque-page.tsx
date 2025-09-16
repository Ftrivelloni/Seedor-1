"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { EmpaqueFormModal } from "./empaque-form-modal"
import { empaqueApi } from "../../lib/api"
import { authService } from "../../lib/auth"
import type { RegistroEmpaque } from "../../lib/mocks"
import { Plus, Search, Download, Package, AlertTriangle, ArrowDown, Cog, Archive, Truck, ArrowUp } from "lucide-react"


export function EmpaquePage() {
  const [registros, setRegistros] = useState<RegistroEmpaque[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<RegistroEmpaque[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  // Filtro de fecha para la tabla de ingreso de fruta
  const [filtroFecha, setFiltroFecha] = useState("");

  const user = authService.getCurrentUser()
  const router = useRouter()

  useEffect(() => {
    loadRegistros()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [registros, searchTerm])

  const loadRegistros = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const data = await empaqueApi.getRegistros(user.tenantId)
      setRegistros(data)
    } catch (error) {
      console.error("Error al cargar registros:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = registros

    if (searchTerm) {
      filtered = filtered.filter(
        (registro) =>
          registro.cultivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          registro.notas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          registro.fecha.includes(searchTerm),
      )
    }

    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    setFilteredRegistros(filtered)
  }

  const handleCreateRegistro = async (registroData: Omit<RegistroEmpaque, "id" | "kgDescartados">) => {
    await empaqueApi.createRegistro(registroData)
    await loadRegistros()
  }

  const navigateToSubpage = (subpage: string) => {
    router.push(`/empaque/${subpage}`)
  }

  const exportToCSV = () => {
    const headers = ["Fecha", "Cultivo", "Kg Entraron", "Kg Salieron", "Kg Descartados", "% Descarte", "Notas"]
    const csvData = [
      headers.join(","),
      ...filteredRegistros.map((registro) => {
        const porcentajeDescarte = ((registro.kgDescartados / registro.kgEntraron) * 100).toFixed(1)
        return [
          registro.fecha,
          `"${registro.cultivo}"`,
          registro.kgEntraron,
          registro.kgSalieron,
          registro.kgDescartados,
          `${porcentajeDescarte}%`,
          `"${registro.notas || ""}"`,
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("download", `registros-empaque-${today}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate statistics
  const totalKgEntraron = registros.reduce((sum, r) => sum + r.kgEntraron, 0)
  const totalKgSalieron = registros.reduce((sum, r) => sum + r.kgSalieron, 0)
  const totalKgDescartados = registros.reduce((sum, r) => sum + r.kgDescartados, 0)
  const porcentajeDescartePromedio = totalKgEntraron > 0 ? (totalKgDescartados / totalKgEntraron) * 100 : 0

  if (!user || !["Admin", "Empaque"].includes(user.rol)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    )
  }

  return (
  <div className="space-y-10">

      {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Empaque</h1>
          <p className="text-muted-foreground">Registros de procesamiento de fruta</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV} disabled={filteredRegistros.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Registro
          </Button>
        </div>
      </div>

      {/* Botones de navegación de módulos */}
  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 my-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('ingreso-fruta')}>
          <CardContent className="p-4 text-center">
            <ArrowDown className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-medium">Ingreso Fruta</h3>
            <p className="text-xs text-muted-foreground">Recepción de materia prima</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('preproceso')}>
          <CardContent className="p-4 text-center">
            <Cog className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <h3 className="font-medium">Preproceso</h3>
            <p className="text-xs text-muted-foreground">Preparación y limpieza</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('pallets')}>
          <CardContent className="p-4 text-center">
            <Archive className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-medium">Pallets</h3>
            <p className="text-xs text-muted-foreground">Gestión de pallets</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('despacho')}>
          <CardContent className="p-4 text-center">
            <Truck className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-medium">Despacho</h3>
            <p className="text-xs text-muted-foreground">Envío a clientes</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('egreso-fruta')}>
          <CardContent className="p-4 text-center">
            <ArrowUp className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <h3 className="font-medium">Egreso Fruta</h3>
            <p className="text-xs text-muted-foreground">Salida de productos</p>
          </CardContent>
        </Card>
      </div>


  {/* Header de resumen */}
  <h2 className="text-xl font-bold mt-10 mb-4">Resumen</h2>
  {/* Resúmenes informativos de cada módulo */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingreso de Fruta - tabla filtrable por fecha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowDown className="h-5 w-5 text-blue-600" />
              <span>Ingreso de Fruta</span>
            </CardTitle>
            <CardDescription>Filtrar ingresos por fecha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-2">
              <label htmlFor="filtro-fecha" className="text-sm">Fecha:</label>
              <input
                id="filtro-fecha"
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={filtroFecha}
                onChange={e => setFiltroFecha(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              {filtroFecha && (
                <Button size="sm" variant="ghost" onClick={() => setFiltroFecha("")}>Limpiar</Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg bg-white">
                <thead>
                  <tr className="bg-gray-50 text-muted-foreground">
                    <th className="text-left px-4 py-2 border-b font-semibold">Fecha</th>
                    <th className="text-left px-4 py-2 border-b font-semibold">Cultivo</th>
                    <th className="text-right px-4 py-2 border-b font-semibold">Kg Entraron</th>
                  </tr>
                </thead>
                <tbody>
                  {registros
                    .filter(r => !filtroFecha || r.fecha.startsWith(filtroFecha))
                    .slice(0, 10)
                    .map((r, idx) => (
                      <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2 border-b">{new Date(r.fecha).toLocaleDateString()}</td>
                        <td className="px-4 py-2 border-b">{r.cultivo}</td>
                        <td className="px-4 py-2 border-b text-right">{r.kgEntraron.toLocaleString()} kg</td>
                      </tr>
                    ))}
                  {registros.filter(r => !filtroFecha || r.fecha.startsWith(filtroFecha)).length === 0 && (
                    <tr><td colSpan={3} className="text-center text-muted-foreground px-4 py-4">Sin registros</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Preproceso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cog className="h-5 w-5 text-orange-600" />
              <span>Preproceso</span>
            </CardTitle>
            <CardDescription>Resumen de preparación y limpieza</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div><span className="font-medium">Total procesado:</span> {totalKgEntraron.toLocaleString()} kg</div>
              <div><span className="font-medium">Última fecha:</span> {registros.length > 0 ? new Date(registros[0].fecha).toLocaleDateString() : '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Pallets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-green-600" />
              <span>Pallets</span>
            </CardTitle>
            <CardDescription>Resumen de pallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div><span className="font-medium">Total empacado:</span> {totalKgSalieron.toLocaleString()} kg</div>
              <div><span className="font-medium">Última fecha:</span> {registros.length > 0 ? new Date(registros[0].fecha).toLocaleDateString() : '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Despacho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <span>Despacho</span>
            </CardTitle>
            <CardDescription>Resumen de envíos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div><span className="font-medium">Total despachado:</span> {totalKgDescartados.toLocaleString()} kg</div>
              <div><span className="font-medium">Última fecha:</span> {registros.length > 0 ? new Date(registros[0].fecha).toLocaleDateString() : '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Egreso de Fruta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowUp className="h-5 w-5 text-red-600" />
              <span>Egreso de Fruta</span>
            </CardTitle>
            <CardDescription>Resumen de salidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div><span className="font-medium">% descarte promedio:</span> {porcentajeDescartePromedio.toFixed(1)}%</div>
              <div><span className="font-medium">Última fecha:</span> {registros.length > 0 ? new Date(registros[0].fecha).toLocaleDateString() : '-'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      <EmpaqueFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRegistro}
        tenantId={user.tenantId}
      />
    </div>
  )
}
