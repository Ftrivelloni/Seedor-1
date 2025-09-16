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
import type { EgresoFruta } from "../../lib/types"
import { Plus, Search, Download, ArrowUp, DollarSign, AlertTriangle, FileText, Package, ArrowLeft } from "lucide-react"

export function EgresoFrutaPage() {
  const [egresos, setEgresos] = useState<EgresoFruta[]>([])
  const [filteredEgresos, setFilteredEgresos] = useState<EgresoFruta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoMovimientoFilter, setTipoMovimientoFilter] = useState<string>("all")

  const user = authService.getCurrentUser()
  const router = useRouter()

  useEffect(() => {
    loadEgresos()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [egresos, searchTerm, tipoMovimientoFilter])

  const loadEgresos = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      const mockData: EgresoFruta[] = [
        {
          id: "ef001",
          tenantId: user.tenantId,
          fecha: "2024-03-15",
          tipoMovimiento: "venta",
          tipoFruta: "Naranjas",
          cantidad: 1152,
          unidad: "kg",
          destino: "Supermercado Central",
          valorUnitario: 3.2,
          valorTotal: 3686.4,
          responsable: "Carlos Ruiz",
          documentoReferencia: "FAC-2024-001",
          observaciones: "Venta regular, cliente frecuente"
        },
        {
          id: "ef002",
          tenantId: user.tenantId,
          fecha: "2024-03-15",
          tipoMovimiento: "merma",
          tipoFruta: "Limones",
          cantidad: 45,
          unidad: "kg",
          destino: "Compost",
          motivo: "Sobremaduras no comercializables",
          responsable: "María González",
          observaciones: "Material destinado a compostaje"
        },
        {
          id: "ef003",
          tenantId: user.tenantId,
          fecha: "2024-03-14",
          tipoMovimiento: "venta",
          tipoFruta: "Mandarinas",
          cantidad: 800,
          unidad: "kg",
          destino: "Exportación Brasil",
          valorUnitario: 4.5,
          valorTotal: 3600,
          responsable: "Ana López",
          documentoReferencia: "EXP-2024-002",
          observaciones: "Exportación premium, calidad A"
        },
        {
          id: "ef004",
          tenantId: user.tenantId,
          fecha: "2024-03-13",
          tipoMovimiento: "devolucion",
          tipoFruta: "Naranjas",
          cantidad: 120,
          unidad: "kg",
          destino: "Proveedor Original",
          motivo: "Calidad inferior al esperado",
          responsable: "Carlos Ruiz",
          documentoReferencia: "DEV-2024-001",
          observaciones: "Devolución por defectos de calidad"
        },
        {
          id: "ef005",
          tenantId: user.tenantId,
          fecha: "2024-03-16",
          tipoMovimiento: "regalo",
          tipoFruta: "Limones",
          cantidad: 25,
          unidad: "kg",
          destino: "Fundación Comunitaria",
          responsable: "María González",
          observaciones: "Donación para comedor comunitario"
        }
      ]
      setEgresos(mockData)
    } catch (error) {
      console.error("Error al cargar egresos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = egresos

    if (searchTerm) {
      filtered = filtered.filter(
        (egreso) =>
          egreso.tipoFruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
          egreso.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
          egreso.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
          egreso.documentoReferencia?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (tipoMovimientoFilter !== "all") {
      filtered = filtered.filter((egreso) => egreso.tipoMovimiento === tipoMovimientoFilter)
    }

    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    setFilteredEgresos(filtered)
  }

  const exportToCSV = () => {
    const headers = ["Fecha", "Tipo Movimiento", "Tipo Fruta", "Cantidad", "Destino", "Valor Unit.", "Valor Total", "Responsable", "Documento"]
    const csvData = [
      headers.join(","),
      ...filteredEgresos.map((egreso) => [
        egreso.fecha,
        egreso.tipoMovimiento,
        `"${egreso.tipoFruta}"`,
        `${egreso.cantidad} ${egreso.unidad}`,
        `"${egreso.destino}"`,
        egreso.valorUnitario ? `$${egreso.valorUnitario}` : "N/A",
        egreso.valorTotal ? `$${egreso.valorTotal}` : "N/A",
        `"${egreso.responsable}"`,
        `"${egreso.documentoReferencia || ""}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("download", `egreso-fruta-${today}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTipoMovimientoBadge = (tipo: EgresoFruta["tipoMovimiento"]) => {
    switch (tipo) {
      case "venta":
        return <Badge variant="default" className="bg-green-500"><DollarSign className="h-3 w-3 mr-1" />Venta</Badge>
      case "merma":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Merma</Badge>
      case "devolucion":
        return <Badge variant="secondary"><ArrowUp className="h-3 w-3 mr-1" />Devolución</Badge>
      case "regalo":
        return <Badge variant="outline"><Package className="h-3 w-3 mr-1" />Regalo</Badge>
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  // Calculate statistics
  const totalCantidad = egresos.reduce((sum, e) => sum + e.cantidad, 0)
  const totalVentas = egresos
    .filter(e => e.tipoMovimiento === "venta")
    .reduce((sum, e) => sum + (e.valorTotal || 0), 0)
  const totalMerma = egresos
    .filter(e => e.tipoMovimiento === "merma")
    .reduce((sum, e) => sum + e.cantidad, 0)
  const ventas = egresos.filter(e => e.tipoMovimiento === "venta").length

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
            <h1 className="text-2xl font-bold">Egreso de Fruta</h1>
            <p className="text-muted-foreground">Gestión de salidas de productos</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV} disabled={filteredEgresos.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Egreso
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Egresado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCantidad.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">{egresos.length} movimientos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalVentas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{ventas} transacciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Merma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalMerma.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">
              {totalCantidad > 0 ? `${((totalMerma / totalCantidad) * 100).toFixed(1)}%` : "0%"} del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${ventas > 0 ? (totalVentas / egresos.filter(e => e.tipoMovimiento === "venta").reduce((sum, e) => sum + e.cantidad, 0)).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Por kilogramo</p>
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
                placeholder="Buscar por tipo de fruta, destino, responsable o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoMovimientoFilter} onValueChange={setTipoMovimientoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo de movimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="venta">Venta</SelectItem>
                <SelectItem value="merma">Merma</SelectItem>
                <SelectItem value="devolucion">Devolución</SelectItem>
                <SelectItem value="regalo">Regalo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Egresos Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowUp className="h-5 w-5" />
            <span>Registros de Egreso</span>
          </CardTitle>
          <CardDescription>
            {filteredEgresos.length} de {egresos.length} registros
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tipo Fruta</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Motivo/Observ.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEgresos.map((egreso) => (
                  <TableRow key={egreso.id}>
                    <TableCell className="font-medium">
                      {new Date(egreso.fecha).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getTipoMovimientoBadge(egreso.tipoMovimiento)}</TableCell>
                    <TableCell>{egreso.tipoFruta}</TableCell>
                    <TableCell className="text-right font-medium">
                      {egreso.cantidad.toLocaleString()} {egreso.unidad}
                    </TableCell>
                    <TableCell>{egreso.destino}</TableCell>
                    <TableCell className="text-right">
                      {egreso.valorUnitario ? (
                        <span className="text-green-600 font-medium">${egreso.valorUnitario}</span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {egreso.valorTotal ? (
                        <span className="text-green-600 font-bold">${egreso.valorTotal.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{egreso.responsable}</TableCell>
                    <TableCell>
                      {egreso.documentoReferencia ? (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-mono">{egreso.documentoReferencia}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sin doc</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-xs text-muted-foreground truncate">
                          {egreso.motivo || egreso.observaciones || "Sin observaciones"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredEgresos.length === 0 && (
            <div className="text-center py-8">
              <ArrowUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron registros de egreso</p>
              <p className="text-sm text-muted-foreground">Registra el primer egreso de fruta</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}