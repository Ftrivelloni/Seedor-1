"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { authService } from "../../lib/auth"
import type { Preproceso } from "../../lib/types"
import { Plus, Search, Download, Cog, Thermometer, Droplets, CheckCircle, Clock, Play, ArrowLeft } from "lucide-react"

export function PreprocesoPage() {
  const [registros, setRegistros] = useState<Preproceso[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<Preproceso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")

  const user = authService.getCurrentUser()
  const router = useRouter()

  useEffect(() => {
    loadRegistros()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [registros, searchTerm, estadoFilter])

  const loadRegistros = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      const mockData: Preproceso[] = [
        {
          id: "pp001",
          tenantId: user.tenantId,
          fecha: "2024-03-15",
          loteIngreso: "LSJ-2024-001",
          tipoFruta: "Naranjas",
          cantidadInicial: 1500,
          cantidadProcesada: 1420,
          cantidadDescarte: 80,
          motivoDescarte: "Magulladuras y sobremaduras",
          responsable: "María González",
          controlCalidad: true,
          temperatura: 4.5,
          humedad: 85,
          observaciones: "Proceso normal, calidad dentro de parámetros",
          estado: "completado"
        },
        {
          id: "pp002",
          tenantId: user.tenantId,
          fecha: "2024-03-15",
          loteIngreso: "LP-2024-015",
          tipoFruta: "Limones",
          cantidadInicial: 800,
          cantidadProcesada: 750,
          cantidadDescarte: 50,
          motivoDescarte: "Tamaño inferior al estándar",
          responsable: "Carlos Ruiz",
          controlCalidad: true,
          temperatura: 3.8,
          humedad: 80,
          estado: "en_proceso"
        },
        {
          id: "pp003",
          tenantId: user.tenantId,
          fecha: "2024-03-16",
          loteIngreso: "FSJ-2024-002",
          tipoFruta: "Mandarinas",
          cantidadInicial: 1200,
          cantidadProcesada: 0,
          cantidadDescarte: 0,
          responsable: "Ana López",
          controlCalidad: false,
          estado: "pendiente"
        }
      ]
      setRegistros(mockData)
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
          registro.loteIngreso.toLowerCase().includes(searchTerm.toLowerCase()) ||
          registro.tipoFruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
          registro.responsable.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (estadoFilter !== "all") {
      filtered = filtered.filter((registro) => registro.estado === estadoFilter)
    }

    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    setFilteredRegistros(filtered)
  }

  const exportToCSV = () => {
    const headers = ["Fecha", "Lote", "Tipo Fruta", "Cant. Inicial", "Cant. Procesada", "Descarte", "% Descarte", "Responsable", "Estado"]
    const csvData = [
      headers.join(","),
      ...filteredRegistros.map((registro) => {
        const porcentajeDescarte = registro.cantidadInicial > 0 ? ((registro.cantidadDescarte / registro.cantidadInicial) * 100).toFixed(1) : "0"
        return [
          registro.fecha,
          registro.loteIngreso,
          `"${registro.tipoFruta}"`,
          `${registro.cantidadInicial} kg`,
          `${registro.cantidadProcesada} kg`,
          `${registro.cantidadDescarte} kg`,
          `${porcentajeDescarte}%`,
          `"${registro.responsable}"`,
          registro.estado
        ].join(",")
      })
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("download", `preproceso-${today}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getEstadoBadge = (estado: Preproceso["estado"]) => {
    switch (estado) {
      case "completado":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>
      case "en_proceso":
        return <Badge variant="secondary"><Play className="h-3 w-3 mr-1" />En Proceso</Badge>
      case "pendiente":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  // Calculate statistics
  const totalProcesado = registros.reduce((sum, r) => sum + r.cantidadProcesada, 0)
  const totalDescarte = registros.reduce((sum, r) => sum + r.cantidadDescarte, 0)
  const totalInicial = registros.reduce((sum, r) => sum + r.cantidadInicial, 0)
  const porcentajeDescartePromedio = totalInicial > 0 ? (totalDescarte / totalInicial) * 100 : 0
  const completados = registros.filter(r => r.estado === "completado").length

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
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/empaque')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Preproceso</h1>
            <p className="text-muted-foreground">Gestión de preparación y limpieza de fruta</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV} disabled={filteredRegistros.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Preproceso
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Procesado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcesado.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">{registros.length} lotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Descarte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalDescarte.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">Material descartado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">% Descarte Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{porcentajeDescartePromedio.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Eficiencia del preproceso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completados}</div>
            <p className="text-xs text-muted-foreground">Lotes finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Buscar y Filtrar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por lote, tipo de fruta o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cog className="h-5 w-5" />
            <span>Registros de Preproceso</span>
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
                  <TableHead>Lote Ingreso</TableHead>
                  <TableHead>Tipo Fruta</TableHead>
                  <TableHead className="text-right">Cant. Inicial</TableHead>
                  <TableHead className="text-right">Procesada</TableHead>
                  <TableHead className="text-right">Descarte</TableHead>
                  <TableHead className="text-right">% Descarte</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Control Calidad</TableHead>
                  <TableHead>Temp./Hum.</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((registro) => {
                  const porcentajeDescarte = registro.cantidadInicial > 0 ? 
                    (registro.cantidadDescarte / registro.cantidadInicial) * 100 : 0
                  const isHighWaste = porcentajeDescarte > 10

                  return (
                    <TableRow key={registro.id}>
                      <TableCell className="font-medium">
                        {new Date(registro.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{registro.loteIngreso}</TableCell>
                      <TableCell>{registro.tipoFruta}</TableCell>
                      <TableCell className="text-right font-medium">
                        {registro.cantidadInicial.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {registro.cantidadProcesada.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {registro.cantidadDescarte.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={isHighWaste ? "text-destructive font-medium" : ""}>
                          {porcentajeDescarte.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{registro.responsable}</TableCell>
                      <TableCell>
                        {registro.controlCalidad ? (
                          <Badge variant="default" className="bg-green-500">Aprobado</Badge>
                        ) : (
                          <Badge variant="outline">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {registro.temperatura && registro.humedad ? (
                          <div className="text-xs">
                            <div className="flex items-center space-x-1">
                              <Thermometer className="h-3 w-3" />
                              <span>{registro.temperatura}°C</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Droplets className="h-3 w-3" />
                              <span>{registro.humedad}%</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getEstadoBadge(registro.estado)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredRegistros.length === 0 && (
            <div className="text-center py-8">
              <Cog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron registros de preproceso</p>
              <p className="text-sm text-muted-foreground">Inicia el primer preproceso de fruta</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}