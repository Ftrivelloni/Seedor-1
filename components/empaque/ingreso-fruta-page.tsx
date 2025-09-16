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
import type { IngresoFruta } from "../../lib/types"
import { Plus, Search, Download, ArrowDown, Truck, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react"

export function IngresoFrutaPage() {
  const [registros, setRegistros] = useState<IngresoFruta[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<IngresoFruta[]>([])
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
      const mockData: IngresoFruta[] = [
        {
          id: "if001",
          tenantId: user.tenantId,
          fecha: "2024-03-15",
          proveedor: "Finca San José",
          tipoFruta: "Naranjas",
          cantidad: 1500,
          unidad: "kg",
          calidad: "A",
          precioUnitario: 2.5,
          total: 3750,
          numeroLote: "LSJ-2024-001",
          transportista: "Transportes del Valle",
          observaciones: "Fruta en excelente estado",
          estado: "recibido"
        },
        {
          id: "if002",
          tenantId: user.tenantId,
          fecha: "2024-03-15",
          proveedor: "Agrícola Los Pinos",
          tipoFruta: "Limones",
          cantidad: 800,
          unidad: "kg",
          calidad: "B",
          precioUnitario: 2.0,
          total: 1600,
          numeroLote: "LP-2024-015",
          estado: "en_revision"
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
          registro.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          registro.tipoFruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
          registro.numeroLote.toLowerCase().includes(searchTerm.toLowerCase())
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
    const headers = ["Fecha", "Proveedor", "Tipo Fruta", "Cantidad", "Calidad", "Precio Unit.", "Total", "Lote", "Estado"]
    const csvData = [
      headers.join(","),
      ...filteredRegistros.map((registro) => [
        registro.fecha,
        `"${registro.proveedor}"`,
        `"${registro.tipoFruta}"`,
        `${registro.cantidad} ${registro.unidad}`,
        registro.calidad,
        `$${registro.precioUnitario}`,
        `$${registro.total}`,
        registro.numeroLote,
        registro.estado
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("download", `ingreso-fruta-${today}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getEstadoBadge = (estado: IngresoFruta["estado"]) => {
    switch (estado) {
      case "recibido":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Recibido</Badge>
      case "rechazado":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>
      case "en_revision":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En Revisión</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  // Calculate statistics
  const totalCantidad = registros.reduce((sum, r) => sum + r.cantidad, 0)
  const totalValor = registros.reduce((sum, r) => sum + r.total, 0)
  const recibidos = registros.filter(r => r.estado === "recibido").length
  const enRevision = registros.filter(r => r.estado === "en_revision").length

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
            <h1 className="text-2xl font-bold">Ingreso de Fruta</h1>
            <p className="text-muted-foreground">Gestión de recepción de materia prima</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV} disabled={filteredRegistros.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ingreso
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recibido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCantidad.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">{registros.length} ingresos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalValor.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Valor de compras</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recibidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{recibidos}</div>
            <p className="text-xs text-muted-foreground">Lotes aprobados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{enRevision}</div>
            <p className="text-xs text-muted-foreground">Pendientes de aprobación</p>
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
                placeholder="Buscar por proveedor, tipo de fruta o lote..."
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
                <SelectItem value="recibido">Recibido</SelectItem>
                <SelectItem value="en_revision">En Revisión</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowDown className="h-5 w-5" />
            <span>Registros de Ingreso</span>
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
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Tipo Fruta</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Transportista</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell className="font-medium">
                      {new Date(registro.fecha).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>{registro.proveedor}</span>
                      </div>
                    </TableCell>
                    <TableCell>{registro.tipoFruta}</TableCell>
                    <TableCell className="text-right font-medium">
                      {registro.cantidad.toLocaleString()} {registro.unidad}
                    </TableCell>
                    <TableCell>
                      <Badge variant={registro.calidad === "A" ? "default" : registro.calidad === "B" ? "secondary" : "outline"}>
                        {registro.calidad}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${registro.precioUnitario}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${registro.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{registro.numeroLote}</TableCell>
                    <TableCell>{getEstadoBadge(registro.estado)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {registro.transportista || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredRegistros.length === 0 && (
            <div className="text-center py-8">
              <ArrowDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron registros de ingreso</p>
              <p className="text-sm text-muted-foreground">Registra el primer ingreso de fruta</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}