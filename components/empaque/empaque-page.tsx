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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Procesado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKgEntraron.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">{registros.length} registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Empacado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalKgSalieron.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">Producto final</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Descartado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalKgDescartados.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">Material no aprovechable</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">% Descarte Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{porcentajeDescartePromedio.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Eficiencia del proceso</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Buscar Registros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cultivo, fecha o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Registros de Empaque</span>
          </CardTitle>
          <CardDescription>
            {filteredRegistros.length} de {registros.length} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cultivo</TableHead>
                  <TableHead className="text-right">Kg Entraron</TableHead>
                  <TableHead className="text-right">Kg Salieron</TableHead>
                  <TableHead className="text-right">Kg Descartados</TableHead>
                  <TableHead className="text-right">% Descarte</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((registro) => {
                  const porcentajeDescarte = (registro.kgDescartados / registro.kgEntraron) * 100
                  const isHighWaste = porcentajeDescarte > 15

                  return (
                    <TableRow key={registro.id}>
                      <TableCell className="font-medium">{new Date(registro.fecha).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{registro.cultivo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {registro.kgEntraron.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {registro.kgSalieron.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {registro.kgDescartados.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {isHighWaste && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          <span className={isHighWaste ? "text-destructive font-medium" : ""}>
                            {porcentajeDescarte.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-muted-foreground truncate">{registro.notas || "Sin notas"}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredRegistros.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron registros de empaque</p>
              <p className="text-sm text-muted-foreground">Crea el primer registro para comenzar</p>
            </div>
          )}
        </CardContent>
      </Card>

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
